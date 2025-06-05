// File name: src/properties/dto/upload-images.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class UploadImagesDto {
    @ApiProperty({
        description: 'Property images (max 10 files, 5MB each)',
        type: 'array',
        items: { type: 'string', format: 'binary' }
    })
    images: Express.Multer.File[];
}