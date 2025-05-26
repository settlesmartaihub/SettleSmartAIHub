// Filename: src/common/dto/api-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Base API Response
export class ApiResponseDto<T = any> {
    @ApiProperty({
        description: 'Request success status',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: 'Response message',
        example: 'Operation completed successfully',
    })
    message: string;

    @ApiPropertyOptional({
        description: 'Response data',
    })
    data?: T;

    @ApiPropertyOptional({
        description: 'Error details (only present when success is false)',
        example: 'Validation failed for phone number',
    })
    error?: string;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}

// Paginated Response
export class PaginatedResponseDto<T = any> {
    @ApiProperty({
        description: 'Array of data items',
        isArray: true,
    })
    data: T[];

    @ApiProperty({
        description: 'Total number of items',
        example: 45,
    })
    total: number;

    @ApiProperty({
        description: 'Current page number',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'Items per page',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of pages',
        example: 5,
    })
    total_pages: number;
}

// API Paginated Response
export class ApiPaginatedResponseDto<T = any> {
    @ApiProperty({
        description: 'Request success status',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: 'Response message',
        example: 'Data retrieved successfully',
    })
    message: string;

    @ApiProperty({
        description: 'Paginated response data',
    })
    data: PaginatedResponseDto<T>;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;

    @ApiPropertyOptional({
        description: 'Pagination metadata',
        example: {
            total: 45,
            page: 1,
            limit: 10,
            total_pages: 5,
            has_next: true,
            has_prev: false
        },
    })
    pagination?: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

// Validation Error Components
export class ValidationErrorDto {
    @ApiProperty({
        description: 'Field that failed validation',
        example: 'phone_number',
    })
    field: string;

    @ApiProperty({
        description: 'Validation error message',
        example: 'Phone number must be a valid Nigerian number',
    })
    message: string;

    @ApiPropertyOptional({
        description: 'Received value that failed validation',
        example: '08123456',
    })
    value?: any;
}

// Error Response Classes
export class ValidationErrorResponseDto {
    @ApiProperty({
        description: 'Always false for error responses',
        example: false,
    })
    success: boolean;

    @ApiProperty({
        description: 'Error message',
        example: 'Validation failed',
    })
    message: string;

    @ApiProperty({
        description: 'Array of validation errors',
        type: [ValidationErrorDto],
    })
    errors: ValidationErrorDto[];

    @ApiPropertyOptional({
        description: 'Error code for client handling',
        example: 'VALIDATION_ERROR',
    })
    error_code?: string;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}

// Server Errors
export class NotFoundErrorResponseDto {
    @ApiProperty({
        description: 'Always false for error responses',
        example: false,
    })
    success: boolean;

    @ApiProperty({
        description: 'Not found error message',
        example: 'User with phone number +2348123456789 not found',
    })
    message: string;

    @ApiProperty({
        description: 'Error code',
        example: 'NOT_FOUND',
    })
    error_code: string;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}

// Client Errors
export class UnauthorizedErrorResponseDto {
    @ApiProperty({
        description: 'Always false for error responses',
        example: false,
    })
    success: boolean;

    @ApiProperty({
        description: 'Unauthorized error message',
        example: 'Invalid or expired token',
    })
    message: string;

    @ApiProperty({
        description: 'Error code',
        example: 'UNAUTHORIZED',
    })
    error_code: string;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}

// Client Errors
export class ConflictErrorResponseDto {
    @ApiProperty({
        description: 'Always false for error responses',
        example: false,
    })
    success: boolean;

    @ApiProperty({
        description: 'Conflict error message',
        example: 'User with phone number +2348123456789 already exists',
    })
    message: string;

    @ApiProperty({
        description: 'Error code',
        example: 'CONFLICT',
    })
    error_code: string;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}

// Success Response Classes
export class CreateSuccessResponseDto {
    @ApiProperty({
        description: 'Always true for success responses',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: 'Success message',
        example: 'Resource created successfully',
    })
    message: string;

    @ApiProperty({
        description: 'Created resource data with ID',
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            created_at: '2025-01-25T10:30:00Z'
        },
    })
    data: any;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}

export class UpdateSuccessResponseDto {
    @ApiProperty({
        description: 'Always true for success responses',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: 'Success message',
        example: 'Resource updated successfully',
    })
    message: string;

    @ApiProperty({
        description: 'Updated resource data',
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            updated_at: '2025-01-25T10:30:00Z'
        },
    })
    data: any;

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}

export class DeleteSuccessResponseDto {
    @ApiProperty({
        description: 'Always true for success responses',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: 'Success message',
        example: 'Resource deleted successfully',
    })
    message: string;

    @ApiProperty({
        description: 'Deletion confirmation',
        example: {
            deleted: true,
            deleted_at: '2025-01-25T10:30:00Z'
        },
    })
    data: {
        deleted: boolean;
        deleted_at: string;
    };

    @ApiProperty({
        description: 'Response timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    timestamp: string;
}