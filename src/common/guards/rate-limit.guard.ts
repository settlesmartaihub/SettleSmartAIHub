// File name: src/common/guards/rate-limit.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // Use phone number for WhatsApp endpoints, IP for others
        return req.body?.From || req.ip;
    }
}