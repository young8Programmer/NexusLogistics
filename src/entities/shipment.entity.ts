import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { Driver } from './driver.entity';
import { ShipmentItem } from './shipment-item.entity';
import { ShipmentLeg } from './shipment-leg.entity';
import { Transaction } from './transaction.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  LOADING = 'loading',
  IN_TRANSIT = 'in_transit',
  AT_WAREHOUSE = 'at_warehouse',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('shipments')
@Index(['trackingNumber'], { unique: true })
@Index(['status'])
@Index(['driverId', 'status'])
@Index(['originWarehouseId'])
@Index(['destinationWarehouseId'])
@Index(['createdAt'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  trackingNumber: string;

  @Column({ type: 'uuid' })
  originWarehouseId: string;

  @Column({ type: 'uuid', nullable: true })
  destinationWarehouseId: string;

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  destinationAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  driverPayment: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fuelCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  otherExpenses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  companyProfit: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledPickupDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualPickupDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDeliveryDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryDate: Date;

  @Column({ type: 'boolean', default: false })
  isMultiLeg: boolean;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.originShipments)
  @JoinColumn({ name: 'originWarehouseId' })
  originWarehouse: Warehouse;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.destinationShipments)
  @JoinColumn({ name: 'destinationWarehouseId' })
  destinationWarehouse: Warehouse;

  @ManyToOne(() => Driver, (driver) => driver.shipments)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @OneToMany(() => ShipmentItem, (item) => item.shipment, { cascade: true })
  items: ShipmentItem[];

  @OneToMany(() => ShipmentLeg, (leg) => leg.shipment, { cascade: true })
  legs: ShipmentLeg[];

  @OneToMany(() => Transaction, (transaction) => transaction.shipment)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
