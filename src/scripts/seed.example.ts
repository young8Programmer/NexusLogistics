/**
 * Example seed script for initial data
 * Run this manually or create a proper seed command
 * 
 * This is just an example - implement proper seeding based on your needs
 */

import { DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Driver } from '../entities/driver.entity';
import { Stock } from '../entities/stock.entity';

export async function seedExampleData(dataSource: DataSource) {
  const productRepo = dataSource.getRepository(Product);
  const warehouseRepo = dataSource.getRepository(Warehouse);
  const driverRepo = dataSource.getRepository(Driver);
  const stockRepo = dataSource.getRepository(Stock);

  // Create sample products
  const product1 = productRepo.create({
    sku: 'PROD-001',
    name: 'Sample Product 1',
    description: 'This is a sample product',
    category: 'Electronics',
    unitPrice: 100.00,
    unit: 'pcs',
    lowStockThreshold: 10,
    isActive: true,
  });

  const product2 = productRepo.create({
    sku: 'PROD-002',
    name: 'Sample Product 2',
    description: 'Another sample product',
    category: 'Clothing',
    unitPrice: 50.00,
    unit: 'pcs',
    lowStockThreshold: 20,
    isActive: true,
  });

  await productRepo.save([product1, product2]);

  // Create sample warehouses
  const warehouse1 = warehouseRepo.create({
    code: 'WH-001',
    name: 'Main Warehouse',
    address: '123 Main Street, City',
    location: 'City A',
    latitude: 40.7128,
    longitude: -74.0060,
    capacity: 10000,
    isActive: true,
  });

  const warehouse2 = warehouseRepo.create({
    code: 'WH-002',
    name: 'Secondary Warehouse',
    address: '456 Second Avenue, City',
    location: 'City B',
    latitude: 41.8781,
    longitude: -87.6298,
    capacity: 5000,
    isActive: true,
  });

  await warehouseRepo.save([warehouse1, warehouse2]);

  // Create sample drivers
  const driver1 = driverRepo.create({
    firstName: 'John',
    lastName: 'Doe',
    licenseNumber: 'DL-12345',
    phoneNumber: '+1234567890',
    email: 'john.doe@example.com',
    vehicleType: 'Truck',
    vehicleNumber: 'TRK-001',
    status: 'available' as any,
    balance: 0,
    isActive: true,
  });

  await driverRepo.save(driver1);

  // Create sample stock
  const stock1 = stockRepo.create({
    productId: product1.id,
    warehouseId: warehouse1.id,
    quantity: 100,
    reservedQuantity: 0,
    availableQuantity: 100,
    averageCost: 100.00,
  });

  const stock2 = stockRepo.create({
    productId: product2.id,
    warehouseId: warehouse1.id,
    quantity: 50,
    reservedQuantity: 0,
    availableQuantity: 50,
    averageCost: 50.00,
  });

  await stockRepo.save([stock1, stock2]);

  console.log('✅ Seed data created successfully!');
  console.log(`   Products: 2`);
  console.log(`   Warehouses: 2`);
  console.log(`   Drivers: 1`);
  console.log(`   Stock entries: 2`);
}
