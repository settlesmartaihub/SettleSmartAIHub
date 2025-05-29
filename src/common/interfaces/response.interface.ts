// File name: src/common/interfaces/response.interface.ts

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ApiResponseWithPagination<T = any> extends ApiResponse<T> {
    pagination?: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
}

export interface ValidationErrorResponse extends ApiResponse {
    errors: {
        field: string;
        message: string;
    }[];
}

export interface ErrorResponse extends ApiResponse {
    error_code?: string;
    details?: any;
}