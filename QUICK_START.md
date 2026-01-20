# 🚀 Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Setup Database

Create a PostgreSQL database:

```sql
CREATE DATABASE nexus_logistics;
```

## 3. Configure Environment

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nexus_logistics
PORT=3000
NODE_ENV=development
LOW_STOCK_THRESHOLD=10
```

## 4. Start the Application

```bash
# Development mode (with auto-reload)
npm run start:dev
```

The application will start on `http://localhost:3000`

## 5. Test the API

### Create a Product

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Sample Product",
    "description": "Test product",
    "category": "Electronics",
    "unitPrice": 100.00,
    "unit": "pcs",
    "lowStockThreshold": 10
  }'
```

### Create a Warehouse

```bash
curl -X POST http://localhost:3000/warehouses \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WH-001",
    "name": "Main Warehouse",
    "address": "123 Main St",
    "location": "City A"
  }'
```

### Create a Driver

```bash
curl -X POST http://localhost:3000/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "licenseNumber": "DL-12345",
    "phoneNumber": "+1234567890"
  }'
```

### Update Stock

```bash
curl -X POST http://localhost:3000/inventory/stock \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid-here",
    "warehouseId": "warehouse-uuid-here",
    "quantity": 100
  }'
```

### Create a Shipment

```bash
curl -X POST http://localhost:3000/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "originWarehouseId": "warehouse-uuid-here",
    "destinationWarehouseId": "destination-warehouse-uuid-here",
    "items": [
      {
        "productId": "product-uuid-here",
        "quantity": 10
      }
    ],
    "scheduledPickupDate": "2024-01-15T10:00:00Z"
  }'
```

### Add to Queue

```bash
curl -X POST http://localhost:3000/queue \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "warehouse-uuid-here",
    "shipmentId": "shipment-uuid-here",
    "driverId": "driver-uuid-here",
    "priority": 1,
    "estimatedLoadingMinutes": 60
  }'
```

### Settle Shipment

```bash
curl -X POST http://localhost:3000/financial/settle/shipment-uuid-here \
  -H "Content-Type: application/json" \
  -d '{
    "fuelCost": 150.00,
    "otherExpenses": 50.00
  }'
```

## 📚 Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Explore all available endpoints
3. Set up proper authentication (if needed)
4. Configure production environment variables
5. Set up database migrations for production

## 🔍 Useful Commands

```bash
# Build for production
npm run build

# Run production build
npm run start:prod

# Run linting
npm run lint

# Format code
npm run format

# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```
