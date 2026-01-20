# 🚀 Nexus Logistics ERP Backend

Professional Enterprise Resource Planning (ERP) backend system for logistics management. This system connects large warehouses, manufacturers, and truck drivers through a comprehensive backend infrastructure.

## 📋 Features

### 🛠 Core Functionalities

1. **Inventory & Warehouse Management**
   - Real-time stock tracking across multiple warehouses
   - Automatic purchase order generation when stock falls below threshold
   - Stock reservation and consumption with ACID transaction safety
   - Multi-warehouse inventory visibility

2. **Multi-Leg Shipment Management**
   - Complex shipment chains: Origin → Warehouse 1 → Warehouse 2 → Warehouse 3 → Customer
   - Sequential leg tracking with status management
   - Automatic status progression through shipment lifecycle

3. **Real-Time Queue System**
   - Intelligent truck queue management at warehouses
   - Priority-based queue processing
   - Loading time tracking and statistics
   - Automatic status updates for shipments and drivers

4. **Financial Settlement**
   - Automatic driver payment calculation (65% of shipment value)
   - Expense tracking (fuel, food, etc.)
   - Company profit calculation
   - Transaction history with balance tracking
   - Financial reporting

5. **Digital Signature & Status Chain**
   - Complete shipment lifecycle tracking
   - Status transitions: PENDING → QUEUED → LOADING → IN_TRANSIT → DELIVERED
   - ACID transaction safety for all status changes
   - Timestamp tracking for all critical events

## 🏗 Architecture

### Tech Stack
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL
- **ORM**: TypeORM 0.3.x
- **Language**: TypeScript
- **Validation**: class-validator, class-transformer

### Database Entities

```
Product ←→ Stock ←→ Warehouse
   ↓         ↓
ShipmentItem  Shipment ←→ Driver
   ↓              ↓
ShipmentLeg   Transaction
   ↓
QueueEntry
```

### Key Relationships
- **Product ↔ Stock ↔ Warehouse**: Many-to-Many through Stock entity
- **Shipment ↔ ShipmentItem**: One-to-Many
- **Shipment ↔ ShipmentLeg**: One-to-Many (for multi-leg shipments)
- **Shipment ↔ Driver**: Many-to-One
- **Driver ↔ Transaction**: One-to-Many
- **Warehouse ↔ QueueEntry**: One-to-Many

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NexusLogistics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
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

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE nexus_logistics;
   ```

5. **Run migrations** (if using migrations)
   ```bash
   npm run migration:run
   ```
   
   Or let TypeORM synchronize in development:
   ```bash
   # Set NODE_ENV=development in .env
   # TypeORM will auto-sync schema
   ```

6. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 🔌 API Endpoints

### Products
- `POST /products` - Create product
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID

### Warehouses
- `POST /warehouses` - Create warehouse
- `GET /warehouses` - Get all warehouses
- `GET /warehouses/:id` - Get warehouse by ID
- `PUT /warehouses/:id` - Update warehouse
- `DELETE /warehouses/:id` - Delete warehouse (soft delete)

### Inventory
- `POST /inventory/stock` - Update stock quantity
- `POST /inventory/stock/reserve` - Reserve stock
- `POST /inventory/stock/release` - Release reserved stock
- `POST /inventory/stock/consume` - Consume stock
- `GET /inventory/stock/warehouse/:warehouseId` - Get stock by warehouse
- `GET /inventory/stock/product/:productId` - Get stock by product
- `GET /inventory/low-stock` - Get low stock products
- `GET /inventory/purchase-orders` - Get purchase orders

### Drivers
- `POST /drivers` - Create driver
- `GET /drivers` - Get all drivers
- `GET /drivers/:id` - Get driver by ID
- `PUT /drivers/:id` - Update driver
- `PUT /drivers/:id/status` - Update driver status
- `DELETE /drivers/:id` - Delete driver (soft delete)

### Shipments
- `POST /shipments` - Create shipment
- `GET /shipments` - Get all shipments (with filters)
- `GET /shipments/:id` - Get shipment by ID
- `GET /shipments/tracking/:trackingNumber` - Get shipment by tracking number
- `PUT /shipments/:id/status` - Update shipment status
- `PUT /shipments/:id/assign-driver` - Assign driver to shipment
- `PUT /shipments/:id/legs/:sequence/status` - Update leg status
- `POST /shipments/:id/unload` - Unload shipment at warehouse

### Queue
- `POST /queue` - Add shipment to queue
- `GET /queue/warehouse/:warehouseId` - Get queue by warehouse
- `GET /queue/warehouse/:warehouseId/next` - Get next in queue
- `PUT /queue/:id/start-loading` - Start loading
- `PUT /queue/:id/finish-loading` - Finish loading
- `PUT /queue/:id/cancel` - Cancel queue entry
- `PUT /queue/:id/priority` - Update priority
- `GET /queue/warehouse/:warehouseId/statistics` - Get queue statistics

### Financial
- `POST /financial/settle/:shipmentId` - Settle shipment payment
- `POST /financial/transactions` - Create transaction
- `GET /financial/drivers/:driverId/transactions` - Get driver transactions
- `GET /financial/drivers/:driverId/balance` - Get driver balance
- `GET /financial/report` - Get company financial report

## 🔄 Transaction Safety

All critical operations use database transactions to ensure ACID compliance:

- **Stock Operations**: Reserve, consume, and update operations are atomic
- **Shipment Creation**: Product verification, stock reservation, and shipment creation happen atomically
- **Financial Settlement**: Driver balance updates and transaction creation are atomic
- **Status Updates**: Status changes and related entity updates are atomic

## 📊 Database Indexing

The system includes strategic indexes for performance:

- **Products**: `sku` (unique), `name`
- **Warehouses**: `code` (unique), `name`, `location`
- **Stocks**: `(warehouseId, productId)` (unique), `quantity`
- **Shipments**: `trackingNumber` (unique), `status`, `(driverId, status)`, `createdAt`
- **Drivers**: `licenseNumber` (unique), `phoneNumber`, `status`
- **Transactions**: `(driverId, status)`, `shipmentId`, `(type, status)`, `createdAt`
- **Queue Entries**: `(warehouseId, status, priority)`, `driverId`, `shipmentId`

## 🧪 Example Usage

### Create a Multi-Leg Shipment

```json
POST /shipments
{
  "originWarehouseId": "uuid-1",
  "destinationWarehouseId": "uuid-2",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 100
    }
  ],
  "legs": [
    {
      "sequence": 1,
      "fromWarehouseId": "uuid-1",
      "toWarehouseId": "uuid-2",
      "scheduledDepartureDate": "2024-01-15T10:00:00Z",
      "scheduledArrivalDate": "2024-01-15T14:00:00Z"
    },
    {
      "sequence": 2,
      "fromWarehouseId": "uuid-2",
      "toWarehouseId": "uuid-3",
      "scheduledDepartureDate": "2024-01-15T15:00:00Z",
      "scheduledArrivalDate": "2024-01-15T19:00:00Z"
    }
  ],
  "isMultiLeg": true
}
```

### Settle a Shipment

```json
POST /financial/settle/shipment-uuid
{
  "fuelCost": 150.00,
  "otherExpenses": 50.00
}
```

This will:
1. Calculate driver payment (65% of shipment value)
2. Calculate company profit
3. Update driver balance
4. Create transaction records
5. All in a single ACID transaction

## 🚦 Status Flow

### Shipment Status Flow
```
PENDING → QUEUED → LOADING → IN_TRANSIT → AT_WAREHOUSE → DELIVERED
```

### Leg Status Flow (Multi-Leg)
```
PENDING → IN_TRANSIT → ARRIVED → UNLOADED → COMPLETED
```

### Queue Status Flow
```
WAITING → LOADING → COMPLETED
```

## 🔒 Error Handling

The system includes comprehensive error handling:
- `NotFoundException`: Entity not found
- `BadRequestException`: Invalid operation or insufficient resources
- Validation errors via class-validator

## 📈 Performance Considerations

- Database indexes on frequently queried columns
- Query optimization with TypeORM QueryBuilder
- Transaction batching for bulk operations
- Efficient relationship loading with proper `relations` configuration

## 🛠 Development

```bash
# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## 📝 License

This project is proprietary software.

## 👥 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ using NestJS + TypeORM + PostgreSQL**
