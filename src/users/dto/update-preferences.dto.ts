// File name: src/users/dto/update-preferences.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

enum PropertyType {
    ROOM = 'room',
    SELF_CONTAIN = 'self-contain',
    ONE_BEDROOM = '1-bedroom',
    TWO_BEDROOM = '2-bedroom',
    THREE_BEDROOM = '3-bedroom',
    DUPLEX = 'duplex',
    BUNGALOW = 'bungalow'
}

export class UpdatePreferencesDto {
    @ApiProperty({
        description: 'User property preferences object',
        example: {
            propertyType: '2-bedroom',
            bedrooms: 2,
            amenities: ['parking', 'security', 'water', 'electricity'],
            preferredAreas: ['Lugbe Extension', 'Lugbe Central'],
            maxCommute: 30,
            petFriendly: false,
            furnished: true,
            utilities: ['electricity', 'water', 'internet']
        }
    })
    @IsObject()
    preferences: {
        propertyType?: PropertyType;
        bedrooms?: number;
        amenities?: string[];
        preferredAreas?: string[];
        maxCommute?: number;
        petFriendly?: boolean;
        furnished?: boolean;
        utilities?: string[];
        [key: string]: any;
    };
}