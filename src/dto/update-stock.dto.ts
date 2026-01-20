import { IsUUID, IsNumber, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  warehouseId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
