// src/common/utils/upload/file-upload.util.ts
import { BadRequestException } from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

export class FileUploadUtil {
    static createMulterOptions(destination: string, maxSize = 5 * 1024 * 1024) {
        return {
            storage: multer.diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = path.join(process.cwd(), 'uploads', destination);
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const extension = path.extname(file.originalname);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
                }
            }),
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('image/')) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException('Only image files are allowed'), false);
                }
            },
            limits: {
                fileSize: maxSize
            }
        };
    }

    static validateImageFile(file: Express.Multer.File): void {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed');
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size too large. Maximum size is 5MB');
        }
    }

    static generateImageUrl(filename: string, baseUrl: string): string {
        return `${baseUrl}/uploads/properties/${filename}`;
    }
}