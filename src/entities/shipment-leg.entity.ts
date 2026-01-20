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
import { Shipment } from './shipment.entity';
import { Warehouse } from './warehouse.entity';

export enum LegStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  UNLOADED = 'unloaded',
  COMPLETED = 'completed',
}

@Entity('shipment_legs')
@Index(['shipmentId', 'sequence'])
@Index(['status'])
export class ShipmentLeg {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  shipmentId: string;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ type: 'uuid' })
  fromWarehouseId: string;

  @Column({ type: 'uuid' })
  toWarehouseId: string;

  @Column({
    type: 'enum',
    enum: LegStatus,
    default: LegStatus.PENDING,
  })
  status: LegStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDepartureDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDepartureDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledArrivalDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualArrivalDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  unloadedDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.legs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'fromWarehouseId' })
  fromWarehouse: Warehouse;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'toWarehouseId' })
  toWarehouse: Warehouse;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
