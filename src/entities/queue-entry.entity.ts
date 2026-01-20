import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { Shipment } from './shipment.entity';
import { Driver } from './driver.entity';

export enum QueueStatus {
  WAITING = 'waiting',
  LOADING = 'loading',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('queue_entries')
@Index(['warehouseId', 'status', 'priority'])
@Index(['driverId'])
@Index(['shipmentId'])
export class QueueEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'uuid' })
  shipmentId: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'timestamp' })
  arrivalTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  startLoadingTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishLoadingTime: Date;

  @Column({ type: 'int', default: 0 })
  estimatedLoadingMinutes: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.queueEntries)
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @ManyToOne(() => Shipment, (shipment) => shipment)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @ManyToOne(() => Driver, (driver) => driver)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
