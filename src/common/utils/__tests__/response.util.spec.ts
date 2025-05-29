// File name: src/common/utils/__tests__/response.util.spec.ts

import { ResponseUtil } from '../response.util';

describe('ResponseUtil', () => {
    describe('success', () => {
        it('should create successful response', () => {
            const data = { id: 1, name: 'Test' };
            const result = ResponseUtil.success(data, 'Test message');

            expect(result.success).toBe(true);
            expect(result.message).toBe('Test message');
            expect(result.data).toEqual(data);
            expect(result.timestamp).toBeDefined();
        });

        it('should use default message', () => {
            const result = ResponseUtil.success({ test: true });
            expect(result.message).toBe('Success');
        });
    });

    describe('error', () => {
        it('should create error response', () => {
            const result = ResponseUtil.error('Error message', { field: 'error' });

            expect(result.success).toBe(false);
            expect(result.message).toBe('Error message');
            expect(result.data).toBe(null);
            expect(result.errors).toEqual({ field: 'error' });
        });
    });

    describe('paginated', () => {
        it('should create paginated response', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const result = ResponseUtil.paginated(data, 10, 1, 5);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(data);
            expect(result.meta.total).toBe(10);
            expect(result.meta.page).toBe(1);
            expect(result.meta.limit).toBe(5);
            expect(result.meta.totalPages).toBe(2);
            expect(result.meta.hasNext).toBe(true);
            expect(result.meta.hasPrev).toBe(false);
        });
    });
});