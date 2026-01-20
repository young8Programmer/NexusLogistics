import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { ShipmentItem } from '../entities/shipment-item.entity';
import { ShipmentLeg, LegStatus } from '../entities/shipment-leg.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private shipmentItemRepository: Repository<ShipmentItem>,
    @InjectRepository(ShipmentLeg)
    private shipmentLegRepository: Repository<ShipmentLeg>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(QueueEntry)
    private queueEntryRepository: Repository<QueueEntry>,
    private dataSource: DataSource,
  ) {}

  async createShipment(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const {
      originWarehouseId,
      destinationWarehouseId,
      driverId,
      items,
      legs,
      isMultiLeg,
      ...shipmentData
    } = createShipmentDto;

    // Verify warehouses exist
    const originWarehouse = await this.warehouseRepository.findOne({
      where: { id: originWarehouseId },
    });
    if (!originWarehouse) {
      throw new NotFoundException(
        `Origin warehouse with ID ${originWarehouseId} not found`,
      );
    }

    let destinationWarehouse = null;
    if (destinationWarehouseId) {
      destinationWarehouse = await this.warehouseRepository.findOne({
        where: { id: destinationWarehouseId },
      });
      if (!destinationWarehouse) {
        throw new NotFoundException(
          `Destination warehouse with ID ${destinationWarehouseId} not found`,
        );
      }
    }

    // Verify driver if provided
    let driver = null;
    if (driverId) {
      driver = await this.driverRepository.findOne({ where: { id: driverId } });
      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }
    }

    // Generate tracking number
    const trackingNumber = `TRK-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    return await this.dataSource.transaction(async (manager) => {
      // Calculate total value and weight
      let totalValue = 0;
      let totalWeight = 0;

      // Verify products and calculate totals
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        // Check stock availability
        const stock = await manager.findOne(Stock, {
          where: {
            productId: item.productId,
            warehouseId: originWarehouseId,
          },
        });

        if (!stock || stock.availableQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${stock?.availableQuantity || 0}, Requested: ${item.quantity}`,
          );
        }

        totalValue += product.unitPrice * item.quantity;
        totalWeight += item.quantity; // Assuming 1 unit = 1 kg, adjust as needed
      }

      // Create shipment
      const shipment = manager.create(Shipment, {
        trackingNumber,
        originWarehouseId,
        destinationWarehouseId,
        driverId,
        status: ShipmentStatus.PENDING,
        totalValue,
        totalWeight,
        isMultiLeg: isMultiLeg || (legs && legs.length > 0),
        ...shipmentData,
      });

      const savedShipment = await manager.save(Shipment, shipment);

      // Create shipment items and reserve stock
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
        });

        const shipmentItem = manager.create(ShipmentItem, {
          shipmentId: savedShipment.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.unitPrice,
          totalPrice: product.unitPrice * item.quantity,
        });

        await manager.save(ShipmentItem, shipmentItem);

        // Reserve stock
        const stock = await manager.findOne(Stock, {
          where: {
            productId: item.productId,
            warehouseId: originWarehouseId,
          },
        });

        stock.reservedQuantity += item.quantity;
        stock.availableQuantity = stock.quantity - stock.reservedQuantity;
        await manager.save(Stock, stock);
      }

      // Create shipment legs if multi-leg
      if (legs && legs.length > 0) {
        for (const leg of legs) {
          const shipmentLeg = manager.create(ShipmentLeg, {
            shipmentId: savedShipment.id,
            sequence: leg.sequence,
            fromWarehouseId: leg.fromWarehouseId,
            toWarehouseId: leg.toWarehouseId,
            status: LegStatus.PENDING,
            scheduledDepartureDate: leg.scheduledDepartureDate
              ? new Date(leg.scheduledDepartureDate)
              : null,
            scheduledArrivalDate: leg.scheduledArrivalDate
              ? new Date(leg.scheduledArrivalDate)
              : null,
            distance: leg.distance || null,
          });

          await manager.save(ShipmentLeg, shipmentLeg);
        }
      }

      return await manager.findOne(Shipment, {
        where: { id: savedShipment.id },
        relations: ['items', 'items.product', 'legs', 'driver', 'originWarehouse', 'destinationWarehouse'],
      });
    });
  }

  async getAllShipments(
    status?: ShipmentStatus,
    driverId?: string,
  ): Promise<Shipment[]> {
    const query = this.shipmentRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('shipment.legs', 'legs')
      .leftJoinAndSelect('shipment.driver', 'driver')
      .leftJoinAndSelect('shipment.originWarehouse', 'originWarehouse')
      .leftJoinAndSelect('shipment.destinationWarehouse', 'destinationWarehouse');

    if (status) {
      query.where('shipment.status = :status', { status });
    }

    if (driverId) {
      query.andWhere('shipment.driverId = :driverId', { driverId });
    }

    return await query
      .orderBy('shipment.createdAt', 'DESC')
      .getMany();
  }

  async getShipmentById(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.product',
        'legs',
        'legs.fromWarehouse',
        'legs.toWarehouse',
        'driver',
        'originWarehouse',
        'destinationWarehouse',
        'transactions',
      ],
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }

    return shipment;
  }

  async getShipmentByTrackingNumber(
    trackingNumber: string,
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber },
      relations: [
        'items',
        'items.product',
        'legs',
        'legs.fromWarehouse',
        'legs.toWarehouse',
        'driver',
        'originWarehouse',
        'destinationWarehouse',
      ],
    });

    if (!shipment) {
      throw new NotFoundException(
        `Shipment with tracking number ${trackingNumber} not found`,
      );
    }

    return shipment;
  }

  async updateShipmentStatus(
    id: string,
    status: ShipmentStatus,
  ): Promise<Shipment> {
    return await this.dataSource.transaction(async (manager) => {
      const shipment = await manager.findOne(Shipment, {
        where: { id },
        relations: ['items', 'legs'],
      });

      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${id} not found`);
      }

      const oldStatus = shipment.status;
      shipment.status = status;

      // Update timestamps based on status
      if (status === ShipmentStatus.LOADING && !shipment.actualPickupDate) {
        shipment.actualPickupDate = new Date();
      }

      if (status === ShipmentStatus.DELIVERED && !shipment.actualDeliveryDate) {
        shipment.actualDeliveryDate = new Date();
      }

      // If moving to IN_TRANSIT, update first leg
      if (status === ShipmentStatus.IN_TRANSIT && shipment.isMultiLeg) {
        const firstLeg = shipment.legs.find((l) => l.sequence === 1);
        if (firstLeg && firstLeg.status === LegStatus.PENDING) {
          firstLeg.status = LegStatus.IN_TRANSIT;
          firstLeg.actualDepartureDate = new Date();
          await manager.save(ShipmentLeg, firstLeg);
        }
      }

      return await manager.save(Shipment, shipment);
    });
  }

  async updateLegStatus(
    shipmentId: string,
    legSequence: number,
    status: LegStatus,
  ): Promise<ShipmentLeg> {
    return await this.dataSource.transaction(async (manager) => {
      const leg = await manager.findOne(ShipmentLeg, {
        where: { shipmentId, sequence: legSequence },
      });

      if (!leg) {
        throw new NotFoundException(
          `Leg ${legSequence} not found for shipment ${shipmentId}`,
        );
      }

      leg.status = status;

      if (status === LegStatus.ARRIVED && !leg.actualArrivalDate) {
        leg.actualArrivalDate = new Date();
      }

      if (status === LegStatus.UNLOADED && !leg.unloadedDate) {
        leg.unloadedDate = new Date();
      }

      if (status === LegStatus.COMPLETED) {
        // Move to next leg if exists
        const nextLeg = await manager.findOne(ShipmentLeg, {
          where: { shipmentId, sequence: legSequence + 1 },
        });

        if (nextLeg && nextLeg.status === LegStatus.PENDING) {
          nextLeg.status = LegStatus.IN_TRANSIT;
          nextLeg.actualDepartureDate = new Date();
          await manager.save(ShipmentLeg, nextLeg);
        } else if (!nextLeg) {
          // Last leg completed, update shipment status
          const shipment = await manager.findOne(Shipment, {
            where: { id: shipmentId },
          });
          if (shipment) {
            shipment.status = ShipmentStatus.DELIVERED;
            shipment.actualDeliveryDate = new Date();
            await manager.save(Shipment, shipment);
          }
        }
      }

      return await manager.save(ShipmentLeg, leg);
    });
  }

  async assignDriver(shipmentId: string, driverId: string): Promise<Shipment> {
    return await this.dataSource.transaction(async (manager) => {
      const shipment = await manager.findOne(Shipment, {
        where: { id: shipmentId },
      });

      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
      }

      const driver = await manager.findOne(Driver, {
        where: { id: driverId },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new BadRequestException(
          `Driver ${driver.firstName} ${driver.lastName} is not available`,
        );
      }

      shipment.driverId = driverId;
      driver.status = DriverStatus.ON_ROUTE;

      await manager.save(Driver, driver);
      return await manager.save(Shipment, shipment);
    });
  }

  async unloadShipmentAtWarehouse(
    shipmentId: string,
    warehouseId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const shipment = await manager.findOne(Shipment, {
        where: { id: shipmentId },
        relations: ['items'],
      });

      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
      }

      const warehouse = await manager.findOne(Warehouse, {
        where: { id: warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
      }

      // Consume stock from origin warehouse
      for (const item of shipment.items) {
        // Release reserved stock from origin
        const originStock = await manager.findOne(Stock, {
          where: {
            productId: item.productId,
            warehouseId: shipment.originWarehouseId,
          },
        });

        if (originStock) {
          originStock.reservedQuantity -= item.quantity;
          originStock.quantity -= item.quantity;
          originStock.availableQuantity =
            originStock.quantity - originStock.reservedQuantity;
          await manager.save(Stock, originStock);
        }

        // Add stock to destination warehouse
        let destinationStock = await manager.findOne(Stock, {
          where: {
            productId: item.productId,
            warehouseId: warehouseId,
          },
        });

        if (!destinationStock) {
          destinationStock = manager.create(Stock, {
            productId: item.productId,
            warehouseId: warehouseId,
            quantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
          });
        }

        destinationStock.quantity += item.quantity;
        destinationStock.availableQuantity =
          destinationStock.quantity - destinationStock.reservedQuantity;
        await manager.save(Stock, destinationStock);
      }
    });
  }
}
