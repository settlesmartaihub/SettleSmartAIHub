// File name: src/auth/auth.controller.ts

import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
    LoginDto,
    RegisterDto,
    ChangePasswordDto,
    AuthResponseDto
} from './dto/index';
import { createSuccessResponse, createErrorResponse } from '../common/utils/response.util';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'User Login',
        description: 'Authenticate user (Admin, Agent, or WhatsApp User) and return JWT tokens'
    })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            example: {
                success: true,
                message: 'Login successful',
                data: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    expiresIn: 86400,
                    user: {
                        id: 'uuid-string',
                        name: 'John Doe',
                        email: 'john@realestate.ng',
                        role: 'agent',
                        phone: '+2348123456789',
                        businessName: 'John Properties Ltd',
                        verificationStatus: 'verified'
                    }
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials',
        schema: {
            example: {
                success: false,
                message: 'Invalid credentials',
                data: null,
                errors: {
                    code: 'UNAUTHORIZED',
                    details: 'Email or password is incorrect'
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    async login(@Body() loginDto: LoginDto) {
        try {
            const result = await this.authService.login(loginDto);
            return createSuccessResponse(
                result,
                'Login successful'
            );
        } catch (error) {
            return createErrorResponse(
                error.message,
                error.status || HttpStatus.UNAUTHORIZED,
                { code: 'LOGIN_FAILED', details: error.message }
            );
        }
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Agent Registration',
        description: 'Register a new real estate agent and return JWT tokens'
    })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({
        status: 201,
        description: 'Registration successful',
        schema: {
            example: {
                success: true,
                message: 'Agent registered successfully',
                data: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    expiresIn: 86400,
                    user: {
                        id: 'uuid-string',
                        name: 'John Doe Real Estate',
                        email: 'john@realestate.ng',
                        role: 'agent',
                        phone: '+2348123456789',
                        businessName: 'John Properties Ltd',
                        verificationStatus: 'pending'
                    }
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Agent already exists',
        schema: {
            example: {
                success: false,
                message: 'Agent with this email or phone already exists',
                data: null,
                errors: {
                    code: 'CONFLICT',
                    details: 'Duplicate email or phone number'
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    async register(@Body() registerDto: RegisterDto) {
        try {
            const result = await this.authService.register(registerDto);
            return createSuccessResponse(
                result,
                'Agent registered successfully'
            );
        } catch (error) {
            return createErrorResponse(
                error.message,
                error.status || HttpStatus.BAD_REQUEST,
                { code: 'REGISTRATION_FAILED', details: error.message }
            );
        }
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get User Profile',
        description: 'Get current authenticated user profile information'
    })
    @ApiResponse({
        status: 200,
        description: 'Profile retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'Profile retrieved successfully',
                data: {
                    id: 'uuid-string',
                    name: 'John Doe Real Estate',
                    email: 'john@realestate.ng',
                    phone: '+2348123456789',
                    businessName: 'John Properties Ltd',
                    verificationStatus: 'verified',
                    subscriptionTier: 'premium',
                    rating: 4.5,
                    totalRatings: 23,
                    location: 'Lugbe, Abuja',
                    createdAt: '2025-01-15T10:30:00Z'
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token'
    })
    async getProfile(@Request() req) {
        try {
            const { id: userId, role } = req.user;
            const profile = await this.authService.getProfile(userId, role);
            return createSuccessResponse(
                profile,
                'Profile retrieved successfully'
            );
        } catch (error) {
            return createErrorResponse(
                error.message,
                error.status || HttpStatus.BAD_REQUEST,
                { code: 'PROFILE_FETCH_FAILED', details: error.message }
            );
        }
    }

    @Put('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Change Password',
        description: 'Change current user password'
    })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({
        status: 200,
        description: 'Password changed successfully',
        schema: {
            example: {
                success: true,
                message: 'Password changed successfully',
                data: {
                    message: 'Password updated successfully'
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Current password is incorrect'
    })
    async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        try {
            const { id: userId } = req.user;
            const result = await this.authService.changePassword(userId, changePasswordDto);
            return createSuccessResponse(
                result,
                'Password changed successfully'
            );
        } catch (error) {
            return createErrorResponse(
                error.message,
                error.status || HttpStatus.BAD_REQUEST,
                { code: 'PASSWORD_CHANGE_FAILED', details: error.message }
            );
        }
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'User Logout',
        description: 'Logout current user (client-side token invalidation)'
    })
    @ApiResponse({
        status: 200,
        description: 'Logout successful',
        schema: {
            example: {
                success: true,
                message: 'Logout successful',
                data: {
                    message: 'Please remove the token from client storage'
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    async logout() {
        // JWT tokens are stateless, so logout is handled client-side
        // In production, you might want to maintain a blacklist of tokens
        return createSuccessResponse(
            { message: 'Please remove the token from client storage' },
            'Logout successful'
        );
    }

    @Get('test-admin')
    @ApiOperation({
        summary: 'Test Admin Credentials',
        description: 'Get default admin credentials for testing'
    })
    @ApiResponse({
        status: 200,
        description: 'Admin test credentials',
        schema: {
            example: {
                success: true,
                message: 'Admin test credentials',
                data: {
                    credentials: {
                        email: 'admin@settlesmart.ng',
                        password: 'admin123',
                        role: 'admin'
                    },
                    instructions: 'Use these credentials to test admin login'
                },
                timestamp: '2025-05-26T20:00:00Z'
            }
        }
    })
    async getTestAdminCredentials() {
        return createSuccessResponse(
            {
                credentials: {
                    email: 'admin@settlesmart.ng',
                    password: 'admin123',
                    role: 'admin'
                },
                instructions: 'Use these credentials to test admin login'
            },
            'Admin test credentials'
        );
    }
}