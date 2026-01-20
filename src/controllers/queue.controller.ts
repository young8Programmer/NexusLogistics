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
import { QueueService } from '../services/queue.service';
import { QueueStatus } from '../entities/queue-entry.entity';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToQueue(
    @Body()
    body: {
      warehouseId: string;
      shipmentId: string;
      driverId: string;
      priority?: number;
      estimatedLoadingMinutes?: number;
    },
  ) {
    return await this.queueService.addToQueue(
      body.warehouseId,
      body.shipmentId,
      body.driverId,
      body.priority,
      body.estimatedLoadingMinutes,
    );
  }

  @Get('warehouse/:warehouseId')
  async getQueueByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('status') status?: QueueStatus,
  ) {
    return await this.queueService.getQueueByWarehouse(warehouseId, status);
  }

  @Get('warehouse/:warehouseId/next')
  async getNextInQueue(@Param('warehouseId') warehouseId: string) {
    return await this.queueService.getNextInQueue(warehouseId);
  }

  @Put(':id/start-loading')
  async startLoading(@Param('id') queueEntryId: string) {
    return await this.queueService.startLoading(queueEntryId);
  }

  @Put(':id/finish-loading')
  async finishLoading(@Param('id') queueEntryId: string) {
    return await this.queueService.finishLoading(queueEntryId);
  }

  @Put(':id/cancel')
  async cancelQueueEntry(@Param('id') queueEntryId: string) {
    return await this.queueService.cancelQueueEntry(queueEntryId);
  }

  @Put(':id/priority')
  async updatePriority(
    @Param('id') queueEntryId: string,
    @Body() body: { priority: number },
  ) {
    return await this.queueService.updatePriority(queueEntryId, body.priority);
  }

  @Get('warehouse/:warehouseId/statistics')
  async getQueueStatistics(@Param('warehouseId') warehouseId: string) {
    return await this.queueService.getQueueStatistics(warehouseId);
  }
}
