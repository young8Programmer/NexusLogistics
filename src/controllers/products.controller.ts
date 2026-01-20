import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { CreateProductDto } from '../dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.inventoryService.createProduct(createProductDto);
  }

  @Get()
  async getAllProducts() {
    return await this.inventoryService.getAllProducts();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return await this.inventoryService.getProductById(id);
  }
}
