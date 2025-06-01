// src/auth/strategies/jwt.strategy.ts - WITH DEBUG
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { isUUID } from 'class-validator';

export interface JwtPayload {
    sub: string; // User ID or admin UUID
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        const jwtSecret = configService.get('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: JwtPayload) {
        const { sub, email, role } = payload;

        // Special handling for admin - check both old and new format
        if (role === 'admin') {

            // Handle old admin token format during transition
            if (sub === 'admin-user-id') {
                const adminUUID = '00000000-0000-0000-0000-000000000001';
                const user = await this.authService.validateUserById(adminUUID);
                if (!user) {
                    throw new UnauthorizedException('Admin user not found');
                }
                return {
                    id: adminUUID,
                    email,
                    role,
                    ...user,
                };
            }

            // Handle new admin token format
            if (sub === '00000000-0000-0000-0000-000000000001') {
                const user = await this.authService.validateUserById(sub);
                if (!user) {
                    throw new UnauthorizedException('Admin user not found');
                }
                return {
                    id: sub,
                    email,
                    role,
                    ...user,
                };
            }
        }

        // Validate 'sub' as UUID for regular users
        if (!isUUID(sub)) {
            throw new UnauthorizedException('Invalid token: User ID is not a valid UUID');
        }

        try {
            const user = await this.authService.validateUserById(sub);
            if (!user) {
                throw new UnauthorizedException('User not found or inactive');
            }

            console.log('✅ User validated successfully:', { id: user.id, role: user.role });
            return {
                id: sub,
                email,
                role,
                ...user,
            };
        } catch (error) {
            console.log('❌ Validation error:', error.message);
            throw new UnauthorizedException('Invalid token');
        }
    }
}