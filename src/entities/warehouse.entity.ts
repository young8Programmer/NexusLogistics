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
import { Shipment } from './shipment.entity';
import { QueueEntry } from './queue-entry.entity';

@Entity('warehouses')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['location'])
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Stock, (stock) => stock.warehouse)
  stocks: Stock[];

  @OneToMany(() => Shipment, (shipment) => shipment.originWarehouse)
  originShipments: Shipment[];

  @OneToMany(() => Shipment, (shipment) => shipment.destinationWarehouse)
  destinationShipments: Shipment[];

  @OneToMany(() => QueueEntry, (queue) => queue.warehouse)
  queueEntries: QueueEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
