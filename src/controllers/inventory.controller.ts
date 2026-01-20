import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { UpdateStockDto } from '../dto/update-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock')
  @HttpCode(HttpStatus.OK)
  async updateStock(@Body() updateStockDto: UpdateStockDto) {
    return await this.inventoryService.updateStock(updateStockDto);
  }

  @Post('stock/reserve')
  @HttpCode(HttpStatus.OK)
  async reserveStock(
    @Body()
    body: {
      productId: string;
      warehouseId: string;
      quantity: number;
    },
  ) {
    return await this.inventoryService.reserveStock(
      body.productId,
      body.warehouseId,
      body.quantity,
    );
  }

  @Post('stock/release')
  @HttpCode(HttpStatus.OK)
  async releaseReservedStock(
    @Body()
    body: {
      productId: string;
      warehouseId: string;
      quantity: number;
    },
  ) {
    return await this.inventoryService.releaseReservedStock(
      body.productId,
      body.warehouseId,
      body.quantity,
    );
  }

  @Post('stock/consume')
  @HttpCode(HttpStatus.OK)
  async consumeStock(
    @Body()
    body: {
      productId: string;
      warehouseId: string;
      quantity: number;
    },
  ) {
    return await this.inventoryService.consumeStock(
      body.productId,
      body.warehouseId,
      body.quantity,
    );
  }

  @Get('stock/warehouse/:warehouseId')
  async getStockByWarehouse(@Param('warehouseId') warehouseId: string) {
    return await this.inventoryService.getStockByWarehouse(warehouseId);
  }

  @Get('stock/product/:productId')
  async getStockByProduct(@Param('productId') productId: string) {
    return await this.inventoryService.getStockByProduct(productId);
  }

  @Get('low-stock')
  async getLowStockProducts(@Query('warehouseId') warehouseId?: string) {
    return await this.inventoryService.getLowStockProducts(warehouseId);
  }

  @Get('purchase-orders')
  async getPurchaseOrders(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return await this.inventoryService.getPurchaseOrders(warehouseId, status);
  }
}
