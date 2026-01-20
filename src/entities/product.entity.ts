import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Stock } from './stock.entity';
import { ShipmentItem } from './shipment-item.entity';

@Entity('products')
@Index(['sku'], { unique: true })
@Index(['name'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'varchar', length: 20, default: 'pcs' })
  unit: string;

  @Column({ type: 'int', default: 0 })
  lowStockThreshold: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Stock, (stock) => stock.product)
  stocks: Stock[];

  @OneToMany(() => ShipmentItem, (item) => item.product)
  shipmentItems: ShipmentItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
