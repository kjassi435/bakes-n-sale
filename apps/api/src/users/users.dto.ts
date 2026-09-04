import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class AddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  pincode: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class OrderLineDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;
}

export class PreviewOrderDto {
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  @ArrayMinSize(1)
  items: OrderLineDto[];

  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class CreateOrderDto extends PreviewOrderDto {
  @IsString()
  addressId: string;

  @IsString()
  deliveryDate: string;

  @IsString()
  deliverySlot: string;

  @IsIn(['COD', 'TEST_GATEWAY'])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}
