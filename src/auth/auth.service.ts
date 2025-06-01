// File name: src/auth/auth.service.ts

import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
    BadRequestException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Agent } from '../modules/agents/entities/agent.entity';
import { LoginDto, RegisterDto, ChangePasswordDto, AuthResponseDto, UserRole } from './dto';
import { hashPassword, comparePassword } from '../common/utils/encryption.util';
import { normalizePhoneNumber } from '../common/utils/phone.util';

// Use a valid UUID for admin
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const { email, password, role } = loginDto;

        try {
            let user: any;
            let userRole: string;

            // Determine which entity to check based on role or email domain
            if (role === UserRole.ADMIN || email.includes('admin') || email.includes('settlesmart')) {
                // For admin, we'll create a default admin user if it doesn't exist
                user = await this.findOrCreateAdmin(email);
                userRole = 'admin';
            } else {
                // Try to find agent first (include password field if it exists)
                user = await this.agentRepository.findOne({
                    where: { email },
                    select: ['id', 'email', 'name', 'phone_number', 'business_name', 'verification_status', 'status', 'password']
                });
                if (user) {
                    userRole = 'agent';
                } else {
                    // Check users table
                    user = await this.userRepository.findOne({
                        where: { phone_number: email }
                    });
                    userRole = 'user';
                }
            }

            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            // Password verification for agents and admins
            if (userRole === 'agent' && user.password) {
                // Only verify password if the agent has one set
                const isPasswordValid = await comparePassword(password, user.password);
                if (!isPasswordValid) {
                    throw new UnauthorizedException('Invalid credentials');
                }
            } else if (userRole === 'admin') {
                // Always verify admin password
                const isPasswordValid = await comparePassword(password, user.password);
                if (!isPasswordValid) {
                    throw new UnauthorizedException('Invalid credentials');
                }
            }

            // For agents without password set, allow login for backward compatibility
            // Check if user/agent is active
            if (user.status === 'inactive' || user.status === 'blocked' || user.status === 'suspended') {
                throw new UnauthorizedException('Account is inactive or suspended');
            }

            // Generate tokens
            const tokens = await this.generateTokens(user.id, user.email || user.phone_number, userRole);

            return {
                ...tokens,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email || user.phone_number,
                    role: userRole,
                    phone: user.phone_number || user.email,
                    businessName: user.business_name,
                    verificationStatus: user.verification_status,
                },
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Login failed');
        }
    }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const { name, email, phone, password, businessName, role = UserRole.AGENT } = registerDto;

        try {
            // Normalize phone number
            const normalizedPhone = normalizePhoneNumber(phone);

            // Check if user already exists
            const existingAgent = await this.agentRepository.findOne({
                where: [{ email }, { phone_number: normalizedPhone }]
            });

            if (existingAgent) {
                throw new ConflictException('Agent with this email or phone already exists');
            }

            // Hash password
            const hashedPassword = await hashPassword(password);

            // Create new agent data - FIXED: Proper typing
            const agentData = {
                name,
                email,
                phone_number: normalizedPhone,
                password: hashedPassword, // Password is now properly supported
                business_name: businessName || name,
                verification_status: 'pending' as any,
                status: 'active' as any,
                subscription_tier: 'basic' as any,
                location: 'Lugbe, Abuja',
                rating: 0,
                total_ratings: 0,
                successful_leads: 0,
                total_leads: 0,
            };

            // Proper agent creation and saving
            const newAgent = this.agentRepository.create(agentData);
            const savedAgent = await this.agentRepository.save(newAgent);

            // Proper access to savedAgent properties
            const agentEmail = savedAgent.email || savedAgent.phone_number;
            const tokens = await this.generateTokens(savedAgent.id, agentEmail, 'agent');

            return {
                ...tokens,
                user: {
                    id: savedAgent.id,
                    name: savedAgent.name,
                    email: agentEmail,
                    role: 'agent',
                    phone: savedAgent.phone_number,
                    businessName: savedAgent.business_name,
                    verificationStatus: savedAgent.verification_status,
                },
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Registration failed: ' + error.message);
        }
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
        const { currentPassword, newPassword } = changePasswordDto;

        try {
            // Find agent with password field
            const user = await this.agentRepository.findOne({
                where: { id: userId },
                select: ['id', 'password']
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Check if user has a password field and it's set
            if (!user.password) {
                throw new BadRequestException('Password not set for this account. Please contact support.');
            }

            // Verify current password
            const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new UnauthorizedException('Current password is incorrect');
            }

            // Hash new password
            const hashedNewPassword = await hashPassword(newPassword);

            // Update password
            await this.agentRepository.update(userId, { password: hashedNewPassword });

            return { message: 'Password changed successfully' };
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Password change failed: ' + error.message);
        }
    }

    async getProfile(userId: string, userRole: string): Promise<any> {
        try {
            if (userRole === 'agent') {
                const agent = await this.agentRepository.findOne({ where: { id: userId } });
                if (!agent) {
                    throw new NotFoundException('Agent not found');
                }

                // Remove password from response if it exists (safely)
                const { password, ...agentProfile } = agent as any;

                return {
                    ...agentProfile,
                    // Map to API-friendly names
                    phoneNumber: agent.phone_number,
                    businessName: agent.business_name,
                    verificationStatus: agent.verification_status,
                    subscriptionTier: agent.subscription_tier,
                    totalRatings: agent.total_ratings,
                    successfulLeads: agent.successful_leads,
                    totalLeads: agent.total_leads,
                    lastActivity: agent.last_activity,
                    subscriptionExpiresAt: agent.subscription_expires_at,
                    // Include computed properties if they exist
                    isVerified: agent.is_verified,
                    isActive: agent.is_active,
                    isPremium: agent.is_premium,
                    subscriptionActive: agent.subscription_active,
                    maxListings: agent.max_listings,
                    conversionRate: agent.conversion_rate,
                    displayPhone: agent.display_phone,
                    hasPassword: !!password, // Indicate if password is set
                };
            } else if (userRole === 'user') {
                const user = await this.userRepository.findOne({ where: { id: userId } });
                if (!user) {
                    throw new NotFoundException('User not found');
                }

                return {
                    ...user,
                    phoneNumber: user.phone_number,
                    locationPreference: user.location_preference,
                    budgetMin: user.budget_min,
                    budgetMax: user.budget_max,
                    lastActivity: user.last_activity,
                    propertiesViewed: user.properties_viewed,
                };
            } else if (userRole === 'admin') {
                return {
                    id: userId,
                    name: 'Admin User',
                    email: 'admin@settlesmart.ng',
                    role: 'admin',
                    permissions: ['manage_agents', 'verify_properties', 'view_analytics'],
                };
            }

            throw new NotFoundException('User not found');
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve profile');
        }
    }

    async validateUserById(userId: string): Promise<any> {
        // Check agents first
        let user: any = await this.agentRepository.findOne({
            where: { id: userId },
            select: ['id', 'name', 'email', 'status', 'verification_status']
        });

        if (user) {
            return { ...user, role: 'agent' };
        }

        // Check users
        user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'name', 'phone_number', 'status']
        });

        if (user) {
            return { ...user, role: 'user' };
        }

        // Check if it's admin - FIXED: Use the same UUID as in findOrCreateAdmin
        if (userId === ADMIN_USER_ID) {
            return {
                id: userId,
                name: 'Admin User',
                email: 'admin@settlesmart.ng',
                role: 'admin',
                status: 'active',
            };
        }

        return null;
    }

    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 86400, // 24 hours in seconds
        };
    }

    // Return admin with valid UUID
    private async findOrCreateAdmin(email: string) {
        // For demo purposes, create a default admin
        if (email === 'admin@settlesmart.ng' || email.includes('admin')) {
            return {
                id: ADMIN_USER_ID, // FIXED: Now uses valid UUID
                email: 'admin@settlesmart.ng',
                password: await hashPassword('admin123'), // Default admin password
                name: 'System Admin',
                role: 'admin',
                status: 'active',
            };
        }
        return null;
    }
}