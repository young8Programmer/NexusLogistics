import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';

// Entities
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Stock } from './entities/stock.entity';
import { Driver } from './entities/driver.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { ShipmentLeg } from './entities/shipment-leg.entity';
import { QueueEntry } from './entities/queue-entry.entity';
import { Transaction } from './entities/transaction.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';

// Services
import { InventoryService } from './services/inventory.service';
import { WarehouseService } from './services/warehouse.service';
import { DriverService } from './services/driver.service';
import { ShipmentService } from './services/shipment.service';
import { QueueService } from './services/queue.service';
import { FinancialService } from './services/financial.service';

// Controllers
import { ProductsController } from './controllers/products.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { InventoryController } from './controllers/inventory.controller';
import { DriversController } from './controllers/drivers.controller';
import { ShipmentsController } from './controllers/shipments.controller';
import { QueueController } from './controllers/queue.controller';
import { FinancialController } from './controllers/financial.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Product,
      Warehouse,
      Stock,
      Driver,
      Shipment,
      ShipmentItem,
      ShipmentLeg,
      QueueEntry,
      Transaction,
      PurchaseOrder,
      PurchaseOrderItem,
    ]),
  ],
  controllers: [
    ProductsController,
    WarehousesController,
    InventoryController,
    DriversController,
    ShipmentsController,
    QueueController,
    FinancialController,
  ],
  providers: [
    InventoryService,
    WarehouseService,
    DriverService,
    ShipmentService,
    QueueService,
    FinancialService,
  ],
})
export class AppModule {}
