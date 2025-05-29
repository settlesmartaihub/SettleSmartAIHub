// File name: src/modules/users/dto/update-preferences.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

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
        propertyType?: string;
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