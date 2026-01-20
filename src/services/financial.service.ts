import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { Driver } from '../entities/driver.entity';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    private dataSource: DataSource,
  ) {}

  async settleShipment(
    shipmentId: string,
    fuelCost: number,
    otherExpenses: number = 0,
  ): Promise<{ shipment: Shipment; transaction: Transaction }> {
    return await this.dataSource.transaction(async (manager) => {
      const shipment = await manager.findOne(Shipment, {
        where: { id: shipmentId },
        relations: ['driver', 'items'],
      });

      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
      }

      if (shipment.status !== ShipmentStatus.DELIVERED) {
        throw new BadRequestException(
          `Shipment must be delivered before settlement. Current status: ${shipment.status}`,
        );
      }

      if (!shipment.driverId) {
        throw new BadRequestException('Shipment has no assigned driver');
      }

      const driver = await manager.findOne(Driver, {
        where: { id: shipment.driverId },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${shipment.driverId} not found`);
      }

      // Calculate payment (typically 60-70% of shipment value, adjust as needed)
      const paymentPercentage = 0.65; // 65% to driver
      const driverPayment = shipment.totalValue * paymentPercentage;

      // Calculate company profit
      const totalExpenses = driverPayment + fuelCost + otherExpenses;
      const companyProfit = shipment.totalValue - totalExpenses;

      // Update shipment with financial data
      shipment.driverPayment = driverPayment;
      shipment.fuelCost = fuelCost;
      shipment.otherExpenses = otherExpenses;
      shipment.companyProfit = companyProfit;

      // Get driver's current balance
      const balanceBefore = driver.balance;

      // Create payment transaction
      const paymentTransaction = manager.create(Transaction, {
        driverId: driver.id,
        shipmentId: shipment.id,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.COMPLETED,
        amount: driverPayment,
        balanceBefore,
        balanceAfter: balanceBefore + driverPayment,
        description: `Payment for shipment ${shipment.trackingNumber}`,
        reference: `PAY-${shipment.trackingNumber}`,
      });

      // Update driver balance
      driver.balance = balanceBefore + driverPayment;

      // Create expense transaction if expenses exist
      if (fuelCost > 0 || otherExpenses > 0) {
        const expenseAmount = -(fuelCost + otherExpenses);
        const expenseTransaction = manager.create(Transaction, {
          driverId: driver.id,
          shipmentId: shipment.id,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.COMPLETED,
          amount: expenseAmount,
          balanceBefore: driver.balance,
          balanceAfter: driver.balance + expenseAmount,
          description: `Expenses for shipment ${shipment.trackingNumber}: Fuel: ${fuelCost}, Other: ${otherExpenses}`,
          reference: `EXP-${shipment.trackingNumber}`,
        });

        driver.balance += expenseAmount;
        await manager.save(Transaction, expenseTransaction);
      }

      // Save all changes
      await manager.save(Driver, driver);
      await manager.save(Shipment, shipment);
      const savedTransaction = await manager.save(Transaction, paymentTransaction);

      return {
        shipment: await manager.findOne(Shipment, {
          where: { id: shipmentId },
          relations: ['driver', 'items', 'transactions'],
        }),
        transaction: savedTransaction,
      };
    });
  }

  async createTransaction(
    driverId: string,
    type: TransactionType,
    amount: number,
    description?: string,
    shipmentId?: string,
  ): Promise<Transaction> {
    return await this.dataSource.transaction(async (manager) => {
      const driver = await manager.findOne(Driver, {
        where: { id: driverId },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      if (shipmentId) {
        const shipment = await manager.findOne(Shipment, {
          where: { id: shipmentId },
        });
        if (!shipment) {
          throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }
      }

      const balanceBefore = driver.balance;
      let balanceAfter = balanceBefore;

      // Calculate new balance based on transaction type
      if (type === TransactionType.PAYMENT || type === TransactionType.REFUND) {
        balanceAfter = balanceBefore + amount;
      } else if (
        type === TransactionType.EXPENSE ||
        type === TransactionType.ADJUSTMENT
      ) {
        balanceAfter = balanceBefore + amount; // amount is negative for expenses
      }

      // Validate balance doesn't go negative (for expenses)
      if (balanceAfter < 0 && (type === TransactionType.EXPENSE || type === TransactionType.ADJUSTMENT)) {
        throw new BadRequestException(
          `Insufficient balance. Current: ${balanceBefore}, Required: ${Math.abs(amount)}`,
        );
      }

      const transaction = manager.create(Transaction, {
        driverId,
        shipmentId,
        type,
        status: TransactionStatus.COMPLETED,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        reference: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });

      // Update driver balance
      driver.balance = balanceAfter;
      await manager.save(Driver, driver);

      return await manager.save(Transaction, transaction);
    });
  }

  async getDriverTransactions(
    driverId: string,
    type?: TransactionType,
    limit: number = 50,
  ): Promise<Transaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.shipment', 'shipment')
      .where('transaction.driverId = :driverId', { driverId });

    if (type) {
      query.andWhere('transaction.type = :type', { type });
    }

    return await query
      .orderBy('transaction.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getDriverBalance(driverId: string): Promise<{
    driver: Driver;
    balance: number;
    totalEarnings: number;
    totalExpenses: number;
    transactionCount: number;
  }> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: { driverId, status: TransactionStatus.COMPLETED },
    });

    const totalEarnings = transactions
      .filter((t) => t.type === TransactionType.PAYMENT || t.type === TransactionType.REFUND)
      .reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

    const totalExpenses = Math.abs(
      transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + (t.amount < 0 ? t.amount : 0), 0),
    );

    return {
      driver,
      balance: driver.balance,
      totalEarnings,
      totalExpenses,
      transactionCount: transactions.length,
    };
  }

  async getCompanyFinancialReport(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRevenue: number;
    totalDriverPayments: number;
    totalExpenses: number;
    totalProfit: number;
    shipmentCount: number;
  }> {
    const query = this.shipmentRepository
      .createQueryBuilder('shipment')
      .where('shipment.status = :status', { status: ShipmentStatus.DELIVERED });

    if (startDate) {
      query.andWhere('shipment.actualDeliveryDate >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      query.andWhere('shipment.actualDeliveryDate <= :endDate', { endDate });
    }

    const shipments = await query.getMany();

    const totalRevenue = shipments.reduce(
      (sum, s) => sum + (s.totalValue || 0),
      0,
    );
    const totalDriverPayments = shipments.reduce(
      (sum, s) => sum + (s.driverPayment || 0),
      0,
    );
    const totalExpenses = shipments.reduce(
      (sum, s) => sum + (s.fuelCost || 0) + (s.otherExpenses || 0),
      0,
    );
    const totalProfit = shipments.reduce(
      (sum, s) => sum + (s.companyProfit || 0),
      0,
    );

    return {
      totalRevenue,
      totalDriverPayments,
      totalExpenses,
      totalProfit,
      shipmentCount: shipments.length,
    };
  }
}
