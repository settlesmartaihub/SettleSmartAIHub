// ========================================
// COMPLETE USER MANAGEMENT IMPLEMENTATION
// ========================================

// File name: src/users/users.service.ts

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { User, UserStatus } from '../modules/users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetBudgetDto } from './dto/set-budget.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserSearchDto } from './dto/user-search.dto';
import { UserMatchCriteriaDto } from './dto/user-match-criteria.dto';
import { formatNigerianPhone } from '../common/utils/phone.util';
import { PaginatedResponse } from '../common/interfaces/response.interface';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    // Create new user (WhatsApp auto-registration)
    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const { phone } = createUserDto;

        // Format and validate phone number
        const formattedPhone = formatNigerianPhone(phone);
        if (!formattedPhone) {
            throw new BadRequestException('Invalid Nigerian phone number format');
        }

        // Check if user already exists
        const existingUser = await this.findUserByPhone(formattedPhone);
        if (existingUser) {
            throw new ConflictException('User with this phone number already exists');
        }

        // Create new user
        const user = this.userRepository.create({
            ...createUserDto,
            phone_number: formattedPhone,
            preferences: createUserDto.preferences || {},
            conversationState: {
                currentStep: 'greeting',
                lastMessageAt: new Date(),
                context: {}
            }
        });

        return await this.userRepository.save(user);
    }

    // Find user by phone number (WhatsApp primary lookup)
    async findUserByPhone(phone: string): Promise<User | null> {
        const formattedPhone = formatNigerianPhone(phone);
        if (!formattedPhone) {
            return null;
        }

        return await this.userRepository.findOne({
            where: { phone_number: formattedPhone },
            relations: ['property_searches']
        });
    }

    // Find or create user (WhatsApp auto-registration)
    async findOrCreateUser(phone: string, name?: string): Promise<User> {
        let user = await this.findUserByPhone(phone);

        if (!user) {
            user = await this.createUser({
                phone,
                name: name || `User ${phone.slice(-4)}`,
                status: UserStatus.ACTIVE
            });
        }

        return user;
    }

    // Get user by ID
    async findUserById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['property_searches']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    // Update user profile
    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findUserById(id);

        // Handle phone number update
        if (updateUserDto.phone) {
            const formattedPhone = formatNigerianPhone(updateUserDto.phone);
            if (!formattedPhone) {
                throw new BadRequestException('Invalid Nigerian phone number format');
            }

            // Check if new phone number is already taken
            const existingUser = await this.findUserByPhone(formattedPhone);
            if (existingUser && existingUser.id !== id) {
                throw new ConflictException('Phone number already in use');
            }

            updateUserDto.phone = formattedPhone;
        }

        Object.assign(user, updateUserDto);
        return await this.userRepository.save(user);
    }

    // Set user budget range (WhatsApp conversation)
    async setBudgetRange(id: string, setBudgetDto: SetBudgetDto): Promise<User> {
        const user = await this.findUserById(id);

        const { minBudget, maxBudget } = setBudgetDto;

        // Validate budget range
        if (minBudget >= maxBudget) {
            throw new BadRequestException('Minimum budget must be less than maximum budget');
        }

        if (minBudget < 50000) {
            throw new BadRequestException('Minimum budget must be at least ₦50,000');
        }

        user.budgetMin = minBudget;
        user.budgetMax = maxBudget;

        return await this.userRepository.save(user);
    }

    // Update user preferences (AI conversation)
    async updatePreferences(id: string, updatePreferencesDto: UpdatePreferencesDto): Promise<User> {
        const user = await this.findUserById(id);

        // Merge new preferences with existing ones
        user.preferences = {
            ...user.preferences,
            ...updatePreferencesDto.preferences,
            updatedAt: new Date()
        };

        return await this.userRepository.save(user);
    }

    // Update conversation state (WhatsApp context)
    async updateConversationState(phone: string, state: any): Promise<User> {
        const user = await this.findUserByPhone(phone);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.conversationState = {
            ...user.conversationState,
            ...state,
            lastMessageAt: new Date()
        };

        return await this.userRepository.save(user);
    }

    // Get user search history
    async getUserSearchHistory(id: string): Promise<any[]> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['property_searches']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user.property_searches || [];
    }

    // Search users (Admin functionality)
    async searchUsers(searchDto: UserSearchDto): Promise<PaginatedResponse<User>> {
        const {
            page = 1,
            limit = 10,
            name,
            phone,
            location,
            status,
            budgetMin,
            budgetMax,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = searchDto;

        const query = this.userRepository.createQueryBuilder('user');

        // Apply filters
        if (name) {
            query.andWhere('user.name ILIKE :name', { name: `%${name}%` });
        }

        if (phone) {
            const formattedPhone = formatNigerianPhone(phone);
            if (formattedPhone) {
                query.andWhere('user.phone_number LIKE :phone', { phone: `%${formattedPhone}%` });
            }
        }

        if (location) {
            query.andWhere('user.location ILIKE :location', { location: `%${location}%` });
        }

        if (status) {
            query.andWhere('user.status = :status', { status });
        }

        if (budgetMin) {
            query.andWhere('user.budgetMin >= :budgetMin', { budgetMin });
        }

        if (budgetMax) {
            query.andWhere('user.budgetMax <= :budgetMax', { budgetMax });
        }

        // Apply sorting
        query.orderBy(`user.${sortBy}`, sortOrder);

        // Apply pagination
        const offset = (page - 1) * limit;
        query.skip(offset).take(limit);

        const [users, total] = await query.getManyAndCount();

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        };
    }

    // Find matching users (for agents - potential leads)
    async findMatchingUsers(criteria: UserMatchCriteriaDto): Promise<User[]> {
        const query = this.userRepository.createQueryBuilder('user');

        // Filter by location proximity
        if (criteria.location) {
            query.andWhere('user.location ILIKE :location', {
                location: `%${criteria.location}%`
            });
        }

        // Filter by budget range
        if (criteria.minBudget && criteria.maxBudget) {
            query.andWhere(
                '(user.budgetMin <= :maxBudget AND user.budgetMax >= :minBudget)',
                {
                    minBudget: criteria.minBudget,
                    maxBudget: criteria.maxBudget
                }
            );
        }

        // Filter by property preferences
        if (criteria.propertyType) {
            query.andWhere(
                "user.preferences->>'propertyType' = :propertyType",
                { propertyType: criteria.propertyType }
            );
        }

        // Only active users looking for properties
        query.andWhere('user.status = :status', { status: 'active' });

        // Order by most recent activity
        query.orderBy('user.updatedAt', 'DESC');

        return await query.getMany();
    }

    // Get all users (Admin)
    async findAllUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
        const [users, total] = await this.userRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['property_searches']
        });

        // src/users/users.service.ts - Fix return statements (lines 243 and 304)
        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        };
    }

    // Delete user (Admin only)
    async deleteUser(id: string): Promise<void> {
        const user = await this.findUserById(id);
        await this.userRepository.remove(user);
    }

    // Get user statistics (Admin dashboard)
    async getUserStatistics(): Promise<any> {
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.count({
            where: { status: UserStatus.ACTIVE }
        });
        const inactiveUsers = await this.userRepository.count({
            where: { status: UserStatus.INACTIVE }
        });

        // Users by budget range
        const budgetRanges = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'CASE',
                'WHEN user.budgetMax <= 500000 THEN \'Under ₦500k\'',
                'WHEN user.budgetMax <= 1000000 THEN \'₦500k - ₦1M\'',
                'WHEN user.budgetMax <= 2000000 THEN \'₦1M - ₦2M\'',
                'ELSE \'Above ₦2M\'',
                'END as range',
                'COUNT(*) as count'
            ])
            .where('user.budgetMax IS NOT NULL')
            .groupBy('range')
            .getRawMany();

        return {
            totalUsers,
            activeUsers,
            inactiveUsers,
            budgetDistribution: budgetRanges,
            growthRate: {
                thisMonth: await this.getUsersThisMonth(),
                lastMonth: await this.getUsersLastMonth()
            }
        };
    }

    private async getUsersThisMonth(): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        return await this.userRepository.count({
            where: {
                createdAt: Between(startOfMonth, new Date())
            }
        });
    }

    private async getUsersLastMonth(): Promise<number> {
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);

        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);

        return await this.userRepository.count({
            where: {
                createdAt: Between(startOfLastMonth, endOfLastMonth)
            }
        });
    }

    // Create a new user (for WhatsApp auto-registration)

    async create(createUserData: {
        name: string;
        phone_number: string;
        location: string;
    }): Promise<User> {
        const user = this.userRepository.create(createUserData);
        return await this.userRepository.save(user);
    }

    /**
     * Find user by phone number (for conversation auto-creation)
     */
    async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { phone_number: phoneNumber },
        });
    }

    /**
     * Find all users with pagination (for agent lead generation)
     */
    async findAll(searchDto: { page: number; limit: number }): Promise<PaginatedResponse<User>> {
        const { page = 1, limit = 10 } = searchDto;

        const queryBuilder = this.userRepository.createQueryBuilder('user');

        // Add pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        // Add ordering
        queryBuilder.orderBy('user.created_at', 'DESC');

        // Execute query
        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }
}