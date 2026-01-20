import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  location: string;

  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
