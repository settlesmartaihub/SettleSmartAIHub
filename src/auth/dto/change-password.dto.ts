// src/auth/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Current password',
        example: 'oldpassword123'
    })
    @IsString()
    currentPassword: string;

    @ApiProperty({
        description: 'New password (minimum 6 characters)',
        example: 'newpassword123',
        minLength: 6
    })
    @IsString()
    @MinLength(6, { message: 'New password must be at least 6 characters long' })
    newPassword: string;
}