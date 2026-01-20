import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DriverService } from '../services/driver.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverStatus } from '../entities/driver.entity';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDriver(@Body() createDriverDto: CreateDriverDto) {
    return await this.driverService.createDriver(createDriverDto);
  }

  @Get()
  async getAllDrivers(@Query('status') status?: DriverStatus) {
    return await this.driverService.getAllDrivers(status);
  }

  @Get(':id')
  async getDriverById(@Param('id') id: string) {
    return await this.driverService.getDriverById(id);
  }

  @Put(':id')
  async updateDriver(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateDriverDto>,
  ) {
    return await this.driverService.updateDriver(id, updateData);
  }

  @Put(':id/status')
  async updateDriverStatus(
    @Param('id') id: string,
    @Body() body: { status: DriverStatus },
  ) {
    return await this.driverService.updateDriverStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDriver(@Param('id') id: string) {
    await this.driverService.deleteDriver(id);
  }
}
