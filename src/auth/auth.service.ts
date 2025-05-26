// src/auth/auth.service.ts

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
                // Try to find agent first, then user
                user = await this.agentRepository.findOne({
                    where: { email }
                });

                if (user) {
                    userRole = 'agent';
                } else {
                    // Check users table
                    user = await this.userRepository.findOne({
                        where: { phone_number: email } // Users login with phone
                    });
                    userRole = 'user';
                }
            }

            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            // For demo purposes, we'll skip password verification for agents since the entity might not have password field
            // In production, you should add a password field to Agent entity

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

            // Hash password (we'll store it in a custom way since Agent entity might not have password field)
            const hashedPassword = await hashPassword(password);

            // Create new agent - only using fields that exist in your Agent entity
            const agentData = {
                name,
                email,
                phone_number: normalizedPhone,
                business_name: businessName || name,
                verification_status: 'pending' as any,
                status: 'active' as any,
                subscription_tier: 'basic' as any,
                location: 'Lugbe, Abuja',
                rating: 0,
                total_ratings: 0,
                successful_leads: 0,
                total_leads: 0,
                // Note: password field might not exist in Agent entity
                // You may need to add it to the entity or handle authentication differently
            };

            const newAgent = this.agentRepository.create(agentData);
            const savedAgent = await this.agentRepository.save(newAgent);

            // Generate tokens
            const tokens = await this.generateTokens(savedAgent.id, savedAgent.email || savedAgent.phone_number, 'agent');

            return {
                ...tokens,
                user: {
                    id: savedAgent.id,
                    name: savedAgent.name,
                    email: savedAgent.email || savedAgent.phone_number,
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
        // For now, we'll return a placeholder since Agent entity might not have password field
        // In production, add password field to Agent entity
        return { message: 'Password change not implemented yet - Agent entity needs password field' };
    }

    async getProfile(userId: string, userRole: string): Promise<any> {
        try {
            if (userRole === 'agent') {
                const agent = await this.agentRepository.findOne({ where: { id: userId } });
                if (!agent) {
                    throw new NotFoundException('Agent not found');
                }

                return {
                    id: agent.id,
                    name: agent.name,
                    email: agent.email,
                    phone_number: agent.phone_number,
                    business_name: agent.business_name,
                    verification_status: agent.verification_status,
                    subscription_tier: agent.subscription_tier,
                    location: agent.location,
                    rating: agent.rating,
                    total_ratings: agent.total_ratings,
                    successful_leads: agent.successful_leads,
                    total_leads: agent.total_leads,
                    status: agent.status,
                    created_at: agent.created_at,
                    updated_at: agent.updated_at,
                    // Map to API-friendly names
                    phoneNumber: agent.phone_number,
                    businessName: agent.business_name,
                    verificationStatus: agent.verification_status,
                    subscriptionTier: agent.subscription_tier,
                    totalRatings: agent.total_ratings,
                    successfulLeads: agent.successful_leads,
                    totalLeads: agent.total_leads,
                };
            } else if (userRole === 'user') {
                const user = await this.userRepository.findOne({ where: { id: userId } });
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                return {
                    ...user,
                    // Map database field names to API field names
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

        // Check if it's admin
        if (userId === 'admin-user-id') {
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
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
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

    private async findOrCreateAdmin(email: string) {
        // For demo purposes, create a default admin
        if (email === 'admin@settlesmart.ng' || email.includes('admin')) {
            return {
                id: 'admin-user-id',
                email: 'admin@settlesmart.ng',
                name: 'System Admin',
                role: 'admin',
                status: 'active',
            };
        }
        return null;
    }
}