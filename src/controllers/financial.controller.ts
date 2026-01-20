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
import { FinancialService } from '../services/financial.service';
import { TransactionType } from '../entities/transaction.entity';

@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('settle/:shipmentId')
  @HttpCode(HttpStatus.OK)
  async settleShipment(
    @Param('shipmentId') shipmentId: string,
    @Body() body: { fuelCost: number; otherExpenses?: number },
  ) {
    return await this.financialService.settleShipment(
      shipmentId,
      body.fuelCost,
      body.otherExpenses,
    );
  }

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body()
    body: {
      driverId: string;
      type: TransactionType;
      amount: number;
      description?: string;
      shipmentId?: string;
    },
  ) {
    return await this.financialService.createTransaction(
      body.driverId,
      body.type,
      body.amount,
      body.description,
      body.shipmentId,
    );
  }

  @Get('drivers/:driverId/transactions')
  async getDriverTransactions(
    @Param('driverId') driverId: string,
    @Query('type') type?: TransactionType,
    @Query('limit') limit?: number,
  ) {
    return await this.financialService.getDriverTransactions(
      driverId,
      type,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  @Get('drivers/:driverId/balance')
  async getDriverBalance(@Param('driverId') driverId: string) {
    return await this.financialService.getDriverBalance(driverId);
  }

  @Get('report')
  async getCompanyFinancialReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.financialService.getCompanyFinancialReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
