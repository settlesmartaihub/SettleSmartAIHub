// File name: src/properties/dto/property-match.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PropertyMatchDto {
    @ApiProperty({
        description: 'User phone number for matching preferences',
        example: '+2348123456789'
    })
    @IsString()
    userPhone: string;
}