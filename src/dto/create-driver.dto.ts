import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  licenseNumber: string;

  @IsString()
  phoneNumber: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
