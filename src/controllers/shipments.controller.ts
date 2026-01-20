import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShipmentService } from '../services/shipment.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { ShipmentStatus } from '../entities/shipment.entity';
import { LegStatus } from '../entities/shipment-leg.entity';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createShipment(@Body() createShipmentDto: CreateShipmentDto) {
    return await this.shipmentService.createShipment(createShipmentDto);
  }

  @Get()
  async getAllShipments(
    @Query('status') status?: ShipmentStatus,
    @Query('driverId') driverId?: string,
  ) {
    return await this.shipmentService.getAllShipments(status, driverId);
  }

  @Get('tracking/:trackingNumber')
  async getShipmentByTrackingNumber(
    @Param('trackingNumber') trackingNumber: string,
  ) {
    return await this.shipmentService.getShipmentByTrackingNumber(
      trackingNumber,
    );
  }

  @Get(':id')
  async getShipmentById(@Param('id') id: string) {
    return await this.shipmentService.getShipmentById(id);
  }

  @Put(':id/status')
  async updateShipmentStatus(
    @Param('id') id: string,
    @Body() body: { status: ShipmentStatus },
  ) {
    return await this.shipmentService.updateShipmentStatus(id, body.status);
  }

  @Put(':id/assign-driver')
  async assignDriver(
    @Param('id') id: string,
    @Body() body: { driverId: string },
  ) {
    return await this.shipmentService.assignDriver(id, body.driverId);
  }

  @Put(':id/legs/:sequence/status')
  async updateLegStatus(
    @Param('id') shipmentId: string,
    @Param('sequence') sequence: number,
    @Body() body: { status: LegStatus },
  ) {
    return await this.shipmentService.updateLegStatus(
      shipmentId,
      sequence,
      body.status,
    );
  }

  @Post(':id/unload')
  @HttpCode(HttpStatus.OK)
  async unloadShipmentAtWarehouse(
    @Param('id') shipmentId: string,
    @Body() body: { warehouseId: string },
  ) {
    return await this.shipmentService.unloadShipmentAtWarehouse(
      shipmentId,
      body.warehouseId,
    );
  }
}
