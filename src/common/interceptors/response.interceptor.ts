// File name: src/common/interceptors/response.interceptor.ts

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseUtil } from '../utils/response.util';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // Don't wrap already wrapped responses
                if (data && typeof data === 'object' && 'success' in data) {
                    return data;
                }

                return ResponseUtil.success(data);
            }),
        );
    }
}