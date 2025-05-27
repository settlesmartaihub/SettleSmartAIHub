// src/properties/dto/property-analytics.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PropertyAnalyticsResponseDto {
    @ApiProperty({ description: 'Total number of properties', example: 150 })
    totalProperties: number;

    @ApiProperty({ description: 'Available properties', example: 120 })
    availableProperties: number;

    @ApiProperty({ description: 'Rented properties', example: 30 })
    rentedProperties: number;

    @ApiProperty({ description: 'Occupancy rate percentage', example: '20.00' })
    occupancyRate: string;

    @ApiProperty({
        description: 'Property type distribution',
        example: [
            { type: 'flat', count: 80 },
            { type: 'house', count: 50 }
        ]
    })
    propertyTypeDistribution: Array<{ type: string; count: number }>;

    @ApiProperty({
        description: 'Popular areas with statistics',
        example: [
            { area: 'Lugbe', count: 45, averagePrice: 750000 }
        ]
    })
    popularAreas: Array<{ area: string; count: number; averagePrice: number }>;
}