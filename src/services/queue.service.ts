import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private queueEntryRepository: Repository<QueueEntry>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    private dataSource: DataSource,
  ) {}

  async addToQueue(
    warehouseId: string,
    shipmentId: string,
    driverId: string,
    priority: number = 0,
    estimatedLoadingMinutes: number = 60,
  ): Promise<QueueEntry> {
    return await this.dataSource.transaction(async (manager) => {
      // Verify entities exist
      const warehouse = await manager.findOne(Warehouse, {
        where: { id: warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException(
          `Warehouse with ID ${warehouseId} not found`,
        );
      }

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

      // Check if already in queue
      const existingEntry = await manager.findOne(QueueEntry, {
        where: {
          warehouseId,
          shipmentId,
          status: QueueStatus.WAITING,
        },
      });

      if (existingEntry) {
        throw new BadRequestException(
          `Shipment ${shipmentId} is already in queue for warehouse ${warehouseId}`,
        );
      }

      // Create queue entry
      const queueEntry = manager.create(QueueEntry, {
        warehouseId,
        shipmentId,
        driverId,
        status: QueueStatus.WAITING,
        priority,
        arrivalTime: new Date(),
        estimatedLoadingMinutes,
      });

      // Update shipment status
      shipment.status = ShipmentStatus.QUEUED;
      await manager.save(Shipment, shipment);

      return await manager.save(QueueEntry, queueEntry);
    });
  }

  async getQueueByWarehouse(
    warehouseId: string,
    status?: QueueStatus,
  ): Promise<QueueEntry[]> {
    const query = this.queueEntryRepository
      .createQueryBuilder('queue')
      .leftJoinAndSelect('queue.shipment', 'shipment')
      .leftJoinAndSelect('queue.driver', 'driver')
      .leftJoinAndSelect('queue.warehouse', 'warehouse')
      .where('queue.warehouseId = :warehouseId', { warehouseId });

    if (status) {
      query.andWhere('queue.status = :status', { status });
    }

    return await query
      .orderBy('queue.priority', 'DESC')
      .addOrderBy('queue.arrivalTime', 'ASC')
      .getMany();
  }

  async getNextInQueue(warehouseId: string): Promise<QueueEntry | null> {
    const entry = await this.queueEntryRepository
      .createQueryBuilder('queue')
      .leftJoinAndSelect('queue.shipment', 'shipment')
      .leftJoinAndSelect('queue.driver', 'driver')
      .where('queue.warehouseId = :warehouseId', { warehouseId })
      .andWhere('queue.status = :status', { status: QueueStatus.WAITING })
      .orderBy('queue.priority', 'DESC')
      .addOrderBy('queue.arrivalTime', 'ASC')
      .getOne();

    return entry;
  }

  async startLoading(queueEntryId: string): Promise<QueueEntry> {
    return await this.dataSource.transaction(async (manager) => {
      const queueEntry = await manager.findOne(QueueEntry, {
        where: { id: queueEntryId },
        relations: ['shipment'],
      });

      if (!queueEntry) {
        throw new NotFoundException(
          `Queue entry with ID ${queueEntryId} not found`,
        );
      }

      if (queueEntry.status !== QueueStatus.WAITING) {
        throw new BadRequestException(
          `Queue entry is not in WAITING status. Current status: ${queueEntry.status}`,
        );
      }

      queueEntry.status = QueueStatus.LOADING;
      queueEntry.startLoadingTime = new Date();

      // Update shipment status
      if (queueEntry.shipment) {
        queueEntry.shipment.status = ShipmentStatus.LOADING;
        await manager.save(Shipment, queueEntry.shipment);
      }

      return await manager.save(QueueEntry, queueEntry);
    });
  }

  async finishLoading(queueEntryId: string): Promise<QueueEntry> {
    return await this.dataSource.transaction(async (manager) => {
      const queueEntry = await manager.findOne(QueueEntry, {
        where: { id: queueEntryId },
        relations: ['shipment', 'driver'],
      });

      if (!queueEntry) {
        throw new NotFoundException(
          `Queue entry with ID ${queueEntryId} not found`,
        );
      }

      if (queueEntry.status !== QueueStatus.LOADING) {
        throw new BadRequestException(
          `Queue entry is not in LOADING status. Current status: ${queueEntry.status}`,
        );
      }

      queueEntry.status = QueueStatus.COMPLETED;
      queueEntry.finishLoadingTime = new Date();

      // Update shipment status
      if (queueEntry.shipment) {
        queueEntry.shipment.status = ShipmentStatus.IN_TRANSIT;
        queueEntry.shipment.actualPickupDate = new Date();
        await manager.save(Shipment, queueEntry.shipment);
      }

      // Update driver status
      if (queueEntry.driver) {
        queueEntry.driver.status = DriverStatus.ON_ROUTE;
        await manager.save(Driver, queueEntry.driver);
      }

      return await manager.save(QueueEntry, queueEntry);
    });
  }

  async cancelQueueEntry(queueEntryId: string): Promise<QueueEntry> {
    return await this.dataSource.transaction(async (manager) => {
      const queueEntry = await manager.findOne(QueueEntry, {
        where: { id: queueEntryId },
        relations: ['shipment'],
      });

      if (!queueEntry) {
        throw new NotFoundException(
          `Queue entry with ID ${queueEntryId} not found`,
        );
      }

      if (
        queueEntry.status === QueueStatus.COMPLETED ||
        queueEntry.status === QueueStatus.CANCELLED
      ) {
        throw new BadRequestException(
          `Cannot cancel queue entry with status ${queueEntry.status}`,
        );
      }

      queueEntry.status = QueueStatus.CANCELLED;

      // Update shipment status if needed
      if (queueEntry.shipment && queueEntry.shipment.status === ShipmentStatus.QUEUED) {
        queueEntry.shipment.status = ShipmentStatus.PENDING;
        await manager.save(Shipment, queueEntry.shipment);
      }

      return await manager.save(QueueEntry, queueEntry);
    });
  }

  async updatePriority(
    queueEntryId: string,
    priority: number,
  ): Promise<QueueEntry> {
    const queueEntry = await this.queueEntryRepository.findOne({
      where: { id: queueEntryId },
    });

    if (!queueEntry) {
      throw new NotFoundException(
        `Queue entry with ID ${queueEntryId} not found`,
      );
    }

    queueEntry.priority = priority;
    return await this.queueEntryRepository.save(queueEntry);
  }

  async getQueueStatistics(warehouseId: string): Promise<{
    waiting: number;
    loading: number;
    completed: number;
    averageWaitTime: number;
    averageLoadingTime: number;
  }> {
    const entries = await this.queueEntryRepository.find({
      where: { warehouseId },
    });

    const waiting = entries.filter((e) => e.status === QueueStatus.WAITING)
      .length;
    const loading = entries.filter((e) => e.status === QueueStatus.LOADING)
      .length;
    const completed = entries.filter(
      (e) => e.status === QueueStatus.COMPLETED,
    ).length;

    const completedEntries = entries.filter(
      (e) => e.status === QueueStatus.COMPLETED && e.finishLoadingTime,
    );

    let totalWaitTime = 0;
    let totalLoadingTime = 0;

    completedEntries.forEach((entry) => {
      if (entry.startLoadingTime && entry.arrivalTime) {
        const waitTime =
          (entry.startLoadingTime.getTime() -
            entry.arrivalTime.getTime()) /
          (1000 * 60); // minutes
        totalWaitTime += waitTime;
      }

      if (entry.finishLoadingTime && entry.startLoadingTime) {
        const loadingTime =
          (entry.finishLoadingTime.getTime() -
            entry.startLoadingTime.getTime()) /
          (1000 * 60); // minutes
        totalLoadingTime += loadingTime;
      }
    });

    const averageWaitTime =
      completedEntries.length > 0
        ? totalWaitTime / completedEntries.length
        : 0;
    const averageLoadingTime =
      completedEntries.length > 0
        ? totalLoadingTime / completedEntries.length
        : 0;

    return {
      waiting,
      loading,
      completed,
      averageWaitTime: Math.round(averageWaitTime * 100) / 100,
      averageLoadingTime: Math.round(averageLoadingTime * 100) / 100,
    };
  }
}
