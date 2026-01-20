import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { Transaction } from './transaction.entity';

export enum DriverStatus {
  AVAILABLE = 'available',
  ON_ROUTE = 'on_route',
  LOADING = 'loading',
  UNLOADING = 'unloading',
  OFF_DUTY = 'off_duty',
}

@Entity('drivers')
@Index(['licenseNumber'], { unique: true })
@Index(['phoneNumber'])
@Index(['status'])
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleType: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  vehicleNumber: string;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.AVAILABLE,
  })
  status: DriverStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Shipment, (shipment) => shipment.driver)
  shipments: Shipment[];

  @OneToMany(() => Transaction, (transaction) => transaction.driver)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
