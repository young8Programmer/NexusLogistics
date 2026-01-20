import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { CreateDriverDto } from '../dto/create-driver.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async createDriver(createDriverDto: CreateDriverDto): Promise<Driver> {
    const driver = this.driverRepository.create(createDriverDto);
    return await this.driverRepository.save(driver);
  }

  async getAllDrivers(status?: DriverStatus): Promise<Driver[]> {
    const query = this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.isActive = :isActive', { isActive: true });

    if (status) {
      query.andWhere('driver.status = :status', { status });
    }

    return await query.getMany();
  }

  async getDriverById(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['shipments', 'transactions'],
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    return driver;
  }

  async updateDriverStatus(
    id: string,
    status: DriverStatus,
  ): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    driver.status = status;
    return await this.driverRepository.save(driver);
  }

  async updateDriver(
    id: string,
    updateData: Partial<CreateDriverDto>,
  ): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    Object.assign(driver, updateData);
    return await this.driverRepository.save(driver);
  }

  async deleteDriver(id: string): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    driver.isActive = false;
    await this.driverRepository.save(driver);
  }
}
