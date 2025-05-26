// src/auth/dto/register.dto.ts - CORRECTED VERSION
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { IsNigerianPhone } from '../../common/decorators/phone-validation.decorator';
import { UserRole } from './login.dto';

export class RegisterDto {
    @ApiProperty({
        description: 'Full name',
        example: 'John Doe Real Estate'
    })
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    name: string;

    @ApiProperty({
        description: 'Email address',
        example: 'john@realestate.ng'
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        description: 'Nigerian phone number',
        example: '+2348123456789'
    })
    @IsNigerianPhone()
    phone: string;

    @ApiProperty({
        description: 'Password (minimum 6 characters)',
        example: 'securepassword123',
        minLength: 6
    })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @ApiProperty({
        description: 'Business name (for agents)',
        example: 'John Properties Limited',
        required: false
    })
    @IsOptional()
    @IsString()
    businessName?: string;

    @ApiProperty({
        description: 'User role',
        enum: UserRole,
        example: UserRole.AGENT,
        default: UserRole.AGENT
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole = UserRole.AGENT;
}