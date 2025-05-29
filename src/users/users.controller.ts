// File name: src/users/users.controller.ts

// ========================================
// USERS CONTROLLER - COMPLETE API ENDPOINTS
// ========================================

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpStatus,
    ParseUUIDPipe,
    ValidationPipe,
    UsePipes
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
    ApiBody
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetBudgetDto } from './dto/set-budget.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserSearchDto } from './dto/user-search.dto';
import { UserMatchCriteriaDto } from './dto/user-match-criteria.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ResponseInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({
        summary: 'Create new user',
        description: 'Create a new user account (primarily for WhatsApp auto-registration)'
    })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User created successfully',
        schema: {
            example: {
                success: true,
                message: 'User created successfully',
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'John Doe',
                    phone: '+2348123456789',
                    location: 'Lugbe, Abuja',
                    status: 'active',
                    budgetMin: null,
                    budgetMax: null,
                    preferences: {},
                    createdAt: '2025-05-27T10:30:00.000Z'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data'
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'User with phone number already exists'
    })
    async createUser(@Body() createUserDto: CreateUserDto) {
        return await this.usersService.createUser(createUserDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get all users',
        description: 'Fetch paginated list of all users (Admin only)'
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Users retrieved successfully',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'John Doe',
                        phone: '+2348123456789',
                        location: 'Lugbe, Abuja',
                        budgetMin: 500000,
                        budgetMax: 1000000,
                        status: 'active'
                    }
                ],
                meta: {
                    total: 25,
                    page: 1,
                    limit: 10,
                    totalPages: 3,
                    hasNext: true,
                    hasPrev: false
                }
            }
        }
    })
    async findAllUsers(
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ) {
        return await this.usersService.findAllUsers(Number(page), Number(limit));
    }

    @Get('phone/:phone')
    @ApiOperation({
        summary: 'Find user by phone number',
        description: 'Find user by Nigerian phone number (WhatsApp lookup)'
    })
    @ApiParam({
        name: 'phone',
        description: 'Nigerian phone number (+234XXXXXXXXXX or 08XXXXXXXXX)',
        example: '+2348123456789'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User found successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'John Doe',
                    phone: '+2348123456789',
                    location: 'Lugbe, Abuja',
                    budgetMin: 500000,
                    budgetMax: 1000000,
                    preferences: {
                        propertyType: '2-bedroom',
                        amenities: ['parking', 'security']
                    },
                    conversationState: {
                        currentStep: 'searching',
                        lastMessageAt: '2025-05-27T10:30:00.000Z'
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found'
    })
    async findUserByPhone(@Param('phone') phone: string) {
        const user = await this.usersService.findUserByPhone(phone);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    @Get('search')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Search users',
        description: 'Search users with various filters (Admin/Agent)'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Users search completed successfully'
    })
    async searchUsers(@Query() searchDto: UserSearchDto) {
        return await this.usersService.searchUsers(searchDto);
    }

    @Get('statistics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get user statistics',
        description: 'Get comprehensive user statistics for admin dashboard'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Statistics retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    totalUsers: 150,
                    activeUsers: 120,
                    inactiveUsers: 30,
                    budgetDistribution: [
                        { range: 'Under ₦500k', count: 45 },
                        { range: '₦500k - ₦1M', count: 60 },
                        { range: '₦1M - ₦2M', count: 35 },
                        { range: 'Above ₦2M', count: 10 }
                    ],
                    growthRate: {
                        thisMonth: 25,
                        lastMonth: 18
                    }
                }
            }
        }
    })
    async getUserStatistics() {
        return await this.usersService.getUserStatistics();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get user by ID',
        description: 'Fetch user details by user ID'
    })
    @ApiParam({
        name: 'id',
        description: 'User UUID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User retrieved successfully'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found'
    })
    async findUserById(@Param('id', ParseUUIDPipe) id: string) {
        return await this.usersService.findUserById(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update user profile',
        description: 'Update user profile information'
    })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User updated successfully'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found'
    })
    async updateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto
    ) {
        return await this.usersService.updateUser(id, updateUserDto);
    }

    @Patch(':id/budget')
    @ApiOperation({
        summary: 'Set user budget range',
        description: 'Update user budget range from WhatsApp conversation'
    })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiBody({ type: SetBudgetDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Budget range updated successfully',
        schema: {
            example: {
                success: true,
                message: 'Budget range updated successfully',
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    budgetMin: 500000,
                    budgetMax: 1000000,
                    updatedAt: '2025-05-27T10:30:00.000Z'
                }
            }
        }
    })
    async setBudgetRange(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() setBudgetDto: SetBudgetDto
    ) {
        return await this.usersService.setBudgetRange(id, setBudgetDto);
    }

    @Patch(':id/preferences')
    @ApiOperation({
        summary: 'Update user preferences',
        description: 'Update user property preferences from AI conversation'
    })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiBody({ type: UpdatePreferencesDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Preferences updated successfully'
    })
    async updatePreferences(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePreferencesDto: UpdatePreferencesDto
    ) {
        return await this.usersService.updatePreferences(id, updatePreferencesDto);
    }

    @Get(':id/searches')
    @ApiOperation({
        summary: 'Get user search history',
        description: 'Fetch user property search history'
    })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Search history retrieved successfully',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: 'search-uuid',
                        criteria: {
                            bedrooms: 2,
                            location: 'Lugbe',
                            maxBudget: 800000
                        },
                        resultsCount: 5,
                        createdAt: '2025-05-27T10:30:00.000Z'
                    }
                ]
            }
        }
    })
    async getUserSearchHistory(@Param('id', ParseUUIDPipe) id: string) {
        return await this.usersService.getUserSearchHistory(id);
    }

    @Post('match')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Find matching users',
        description: 'Find users matching specific criteria (for agents to find leads)'
    })
    @ApiBody({ type: UserMatchCriteriaDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Matching users found successfully'
    })
    async findMatchingUsers(@Body() criteria: UserMatchCriteriaDto) {
        return await this.usersService.findMatchingUsers(criteria);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Delete user',
        description: 'Delete user account (Admin only)'
    })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User deleted successfully',
        schema: {
            example: {
                success: true,
                message: 'User deleted successfully'
            }
        }
    })
    async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
        await this.usersService.deleteUser(id);
        return { message: 'User deleted successfully' };
    }
}