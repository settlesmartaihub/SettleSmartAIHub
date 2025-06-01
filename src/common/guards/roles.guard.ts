// File name: src/common/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Get required roles from the decorator
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Get the user from the request (set by JwtAuthGuard)
        const { user } = context.switchToHttp().getRequest();

        // Ensure user exists
        if (!user) {
            return false;
        }

        // Handle both single role (string) and multiple roles (array) formats
        let userRoles: string[] = [];

        if (typeof user.role === 'string') {
            userRoles = [user.role];
        } else if (Array.isArray(user.roles)) {
            userRoles = user.roles;
        } else if (Array.isArray(user.role)) {
            userRoles = user.role;
        }

        // Check if user has any of the required roles
        const hasRole = requiredRoles.some((role) => {
            return userRoles.some((userRole) => {
                const normalizedUserRole = userRole?.toLowerCase();
                const normalizedRequiredRole = role?.toLowerCase();

                return normalizedUserRole === normalizedRequiredRole;
            });
        });

        console.log(`✅ Access ${hasRole ? 'GRANTED' : 'DENIED'}`);
        return hasRole;
    }
}