// File name: src/properties/dto/update-property.dto.ts

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CreatePropertyDto } from './create-property.dto';

enum PropertyStatus {
    AVAILABLE = 'available',
    RENTED = 'rented',
    MAINTENANCE = 'maintenance',
    INACTIVE = 'inactive'
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
    @ApiProperty({ description: 'Property status', enum: PropertyStatus, required: false })
    @IsOptional()
    @IsEnum(PropertyStatus)
    status?: PropertyStatus;
}