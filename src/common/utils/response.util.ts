// File name: src/common/utils/response.util.ts

// import { ApiResponse, PaginatedResponse } from '../interfaces/response.interface';
export class ResponseUtil {
    static success<T>(data: T, message = 'Success'): ApiResponse<T> {
        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    static error(message: string, errors?: any): ApiResponse<null> {
        return {
            success: false,
            message,
            data: null,
            errors,
            timestamp: new Date().toISOString(),
        };
    }

    static paginated<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
    ): PaginatedResponse<T> {
        return {
            success: true,
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
            timestamp: new Date().toISOString(),
        };
    }
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors?: any;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    timestamp: string;
}

export function createResponse<T>(
    data: T,
    message: string,
    success: boolean = true
): ApiResponse<T> {
    return {
        success,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}

export function createSuccessResponse<T>(
    data: T,
    message: string = 'Operation successful'
): ApiResponse<T> {
    return createResponse(data, message, true);
}

export function createErrorResponse(
    message: string,
    statusCode?: number,
    errors?: any
): ApiResponse<null> {
    return {
        success: false,
        message,
        data: null,
        errors,
        timestamp: new Date().toISOString(),
    };
}

export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Data retrieved successfully'
): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        success: true,
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNext,
            hasPrev,
        },
        timestamp: new Date().toISOString(),
    };
}