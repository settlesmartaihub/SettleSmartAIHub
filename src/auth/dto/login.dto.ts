// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
    USER = 'user',
    AGENT = 'agent',
    ADMIN = 'admin'
}

export class LoginDto {
    @ApiProperty({
        description: 'Email address',
        example: 'admin@settlesmart.ng'
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        description: 'Password (minimum 6 characters)',
        example: 'admin123',
        minLength: 6
    })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @ApiProperty({
        description: 'User role for login',
        enum: UserRole,
        example: UserRole.ADMIN,
        required: false
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
