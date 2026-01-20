import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  async createWarehouse(
    createWarehouseDto: CreateWarehouseDto,
  ): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create(createWarehouseDto);
    return await this.warehouseRepository.save(warehouse);
  }

  async getAllWarehouses(): Promise<Warehouse[]> {
    return await this.warehouseRepository.find({
      where: { isActive: true },
      relations: ['stocks'],
    });
  }

  async getWarehouseById(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['stocks', 'stocks.product'],
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async updateWarehouse(
    id: string,
    updateData: Partial<CreateWarehouseDto>,
  ): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    Object.assign(warehouse, updateData);
    return await this.warehouseRepository.save(warehouse);
  }

  async deleteWarehouse(id: string): Promise<void> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    warehouse.isActive = false;
    await this.warehouseRepository.save(warehouse);
  }
}
