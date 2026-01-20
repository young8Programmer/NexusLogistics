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
import { Driver } from './driver.entity';
import { Shipment } from './shipment.entity';

export enum TransactionType {
  PAYMENT = 'payment',
  EXPENSE = 'expense',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
@Index(['driverId', 'status'])
@Index(['shipmentId'])
@Index(['type', 'status'])
@Index(['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'uuid', nullable: true })
  shipmentId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string;

  @ManyToOne(() => Driver, (driver) => driver.transactions)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @ManyToOne(() => Shipment, (shipment) => shipment.transactions)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
