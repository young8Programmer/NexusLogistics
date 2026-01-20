import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WarehouseService } from '../services/warehouse.service';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    return await this.warehouseService.createWarehouse(createWarehouseDto);
  }

  @Get()
  async getAllWarehouses() {
    return await this.warehouseService.getAllWarehouses();
  }

  @Get(':id')
  async getWarehouseById(@Param('id') id: string) {
    return await this.warehouseService.getWarehouseById(id);
  }

  @Put(':id')
  async updateWarehouse(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateWarehouseDto>,
  ) {
    return await this.warehouseService.updateWarehouse(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWarehouse(@Param('id') id: string) {
    await this.warehouseService.deleteWarehouse(id);
  }
}
