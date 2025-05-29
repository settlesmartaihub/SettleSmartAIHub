// File name: src/modules/properties/dto/update-property.dto.ts

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
    @ApiPropertyOptional({
        description: 'Update property title/headline',
        example: 'Updated: Beautiful 2-Bedroom Flat in Lugbe Phase 1',
        maxLength: 200,
    })
    title?: string;

    @ApiPropertyOptional({
        description: 'Update property description',
        example: 'Updated: Spacious 2-bedroom flat with newly renovated amenities...',
        maxLength: 2000,
    })
    description?: string;

    @ApiPropertyOptional({
        description: 'Update monthly rent price in Naira',
        example: 480000,
        minimum: 50000,
    })
    price?: number;

    @ApiPropertyOptional({
        description: 'Update property location details',
        example: {
            area: 'Lugbe Phase 1',
            landmark: 'Near New Shopping Complex',
            coordinates: { latitude: 8.7835, longitude: 7.3990 }
        },
    })
    location?: any;

    @ApiPropertyOptional({
        description: 'Update property amenities',
        example: {
            parking: true,
            security: true,
            power: true,
            water: true,
            internet: true,
            generator: true,
            aircon: false,
            furnished: true
        },
    })
    amenities?: any;
}