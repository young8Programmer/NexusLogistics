import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShipmentItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateShipmentLegDto {
  @IsUUID()
  fromWarehouseId: string;

  @IsUUID()
  toWarehouseId: string;

  @IsNumber()
  sequence: number;

  @IsDateString()
  @IsOptional()
  scheduledDepartureDate?: string;

  @IsDateString()
  @IsOptional()
  scheduledArrivalDate?: string;

  @IsNumber()
  @IsOptional()
  distance?: number;
}

export class CreateShipmentDto {
  @IsUUID()
  originWarehouseId: string;

  @IsUUID()
  @IsOptional()
  destinationWarehouseId?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  destinationAddress?: string;

  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentItemDto)
  items: CreateShipmentItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentLegDto)
  @IsOptional()
  legs?: CreateShipmentLegDto[];

  @IsDateString()
  @IsOptional()
  scheduledPickupDate?: string;

  @IsDateString()
  @IsOptional()
  scheduledDeliveryDate?: string;

  @IsBoolean()
  @IsOptional()
  isMultiLeg?: boolean;
}
