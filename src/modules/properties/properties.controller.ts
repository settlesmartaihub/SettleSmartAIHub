// File name: src/modules/properties/properties.controller.ts

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
    UseInterceptors,
    UploadedFiles,
    Request
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
    ApiBody,
    ApiConsumes
} from '@nestjs/swagger';

// Import Express.Multer.File type
import { Express } from 'express';

// Service and DTO imports
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertySearchDto } from './dto/property-search.dto';
import { PropertyMatchDto } from './dto/property-match.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { UploadImagesDto } from './dto/upload-images.dto';

// Guards and decorators
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { FileUploadUtil } from '../../common/utils/upload/file-upload.util';

// Import our new verification decorator
import { VerifiedAgent, RequireVerifiedAgent } from '../../common/decorators/agent-verified.decorator';

@ApiTags('Properties')
@Controller('properties')
@UseInterceptors(ResponseInterceptor)
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

    @Post()
    @VerifiedAgent() // Use our new decorator
    @ApiOperation({
        summary: 'Create new property listing',
        description: 'Create a new property listing (only verified agents can create properties)'
    })
    @ApiBody({ type: CreatePropertyDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Property created successfully',
        schema: {
            example: {
                success: true,
                message: 'Property created successfully',
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    title: '2-Bedroom Flat in Lugbe Extension',
                    description: 'Beautiful 2-bedroom flat with modern amenities...',
                    property_type: 'flat',
                    price: 750000,
                    location: {
                        address: 'Plot 123, Lugbe Extension, Abuja',
                        area: 'Lugbe',
                        state: 'FCT',
                        coordinates: { latitude: 8.7594, longitude: 7.3831 }
                    },
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: ['parking', 'security', 'water', 'electricity'],
                    verification_status: 'pending',
                    status: 'available',
                    created_at: '2025-05-27T15:30:00.000Z'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Agent not verified',
        schema: {
            example: {
                statusCode: 403,
                message: 'Only verified agents can create property listings',
                error: 'AGENT_NOT_VERIFIED',
                details: {
                    verification_status: 'pending',
                    required_status: 'verified',
                    next_steps: 'Contact admin for account verification'
                }
            }
        }
    })
    async createProperty(@Request() req: any, @Body() createPropertyDto: CreatePropertyDto) {
        const agentId = req.user.id;
        return await this.propertiesService.createProperty(agentId, createPropertyDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all properties',
        description: 'Fetch paginated list of all properties (public access)'
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Properties retrieved successfully'
    })
    async findAllProperties(
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ) {
        return await this.propertiesService.findAllProperties(Number(page), Number(limit));
    }

    @Post('search')
    @ApiOperation({
        summary: 'Advanced property search',
        description: 'Search properties with advanced filters and location-based matching'
    })
    @ApiBody({ type: PropertySearchDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property search completed successfully'
    })
    async searchProperties(@Body() searchDto: PropertySearchDto) {
        return await this.propertiesService.searchProperties(searchDto);
    }

    @Post('match')
    @ApiOperation({
        summary: 'AI property matching',
        description: 'Get AI-powered property recommendations for WhatsApp users'
    })
    @ApiBody({ type: PropertyMatchDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property matching completed successfully'
    })
    async matchProperties(@Body() matchDto: PropertyMatchDto) {
        return await this.propertiesService.matchPropertiesForUser(matchDto.userPhone);
    }

    @Get('analytics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get property analytics',
        description: 'Get comprehensive property market analytics (Admin only)'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Analytics retrieved successfully'
    })
    async getPropertyAnalytics() {
        return await this.propertiesService.getPropertyAnalytics();
    }

    @Get('agent/:agentId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get agent properties',
        description: 'Get all properties belonging to a specific agent'
    })
    @ApiParam({ name: 'agentId', description: 'Agent UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent properties retrieved successfully'
    })
    async getAgentProperties(
        @Param('agentId', ParseUUIDPipe) agentId: string,
        @Query() filterDto: PropertyFilterDto
    ) {
        return await this.propertiesService.getAgentProperties(agentId, filterDto);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get property by ID',
        description: 'Fetch detailed property information by ID'
    })
    @ApiParam({ name: 'id', description: 'Property UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property retrieved successfully'
    })
    async findPropertyById(@Param('id', ParseUUIDPipe) id: string) {
        return await this.propertiesService.findPropertyById(id);
    }

    @Get(':id/similar')
    @ApiOperation({
        summary: 'Get similar properties',
        description: 'Find properties similar to the specified property'
    })
    @ApiParam({ name: 'id', description: 'Property UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Similar properties found successfully'
    })
    async findSimilarProperties(@Param('id', ParseUUIDPipe) id: string) {
        return await this.propertiesService.findSimilarProperties(id);
    }

    @Patch(':id')
    @VerifiedAgent() // Require verification for updates
    @ApiOperation({
        summary: 'Update property',
        description: 'Update property details (verified agents can only update own properties)'
    })
    @ApiParam({ name: 'id', description: 'Property UUID' })
    @ApiBody({ type: UpdatePropertyDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property updated successfully'
    })
    async updateProperty(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
        @Body() updatePropertyDto: UpdatePropertyDto
    ) {
        const agentId = req.user.id;
        return await this.propertiesService.updateProperty(id, agentId, updatePropertyDto);
    }

    @Patch(':id/status')
    @VerifiedAgent() // Require verification for status updates
    @ApiOperation({
        summary: 'Update property status',
        description: 'Update property availability status (available, rented, maintenance)'
    })
    @ApiParam({ name: 'id', description: 'Property UUID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['available', 'rented', 'maintenance', 'inactive'] }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property status updated successfully'
    })
    async updatePropertyStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
        @Body('status') status: string
    ) {
        const agentId = req.user.id;
        return await this.propertiesService.updatePropertyStatus(id, agentId, status);
    }

    @Post(':id/images')
    @VerifiedAgent() // Require verification for image uploads
    @UseInterceptors(FilesInterceptor('images', 10, FileUploadUtil.createMulterOptions('properties')))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Upload property images',
        description: 'Upload multiple images for a property (max 10 images, 5MB each)'
    })
    @ApiParam({ name: 'id', description: 'Property UUID' })
    @ApiBody({
        description: 'Property images',
        type: 'multipart/form-data',
        schema: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' }
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Images uploaded successfully'
    })
    async uploadPropertyImages(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        const agentId = req.user.id;
        // Validate files
        files.forEach(file => FileUploadUtil.validateImageFile(file));
        // Generate image URLs
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrls = files.map(file => FileUploadUtil.generateImageUrl(file.filename, baseUrl));
        return await this.propertiesService.uploadPropertyImages(id, agentId, imageUrls);
    }

    @Delete(':id')
    @RequireVerifiedAgent([
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Property deleted successfully'
        }),
        ApiResponse({
            status: HttpStatus.FORBIDDEN,
            description: 'Agent not verified or not property owner',
            schema: {
                example: {
                    statusCode: 403,
                    message: 'Agent verification required to delete properties',
                    error: 'AGENT_NOT_VERIFIED'
                }
            }
        })
    ])
    @ApiOperation({
        summary: 'Delete property',
        description: 'Delete property listing (verified agents can only delete own properties)'
    })
    @ApiParam({ name: 'id', description: 'Property UUID' })
    async deleteProperty(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
        const agentId = req.user.id;
        await this.propertiesService.deleteProperty(id, agentId);
        return { message: 'Property deleted successfully' };
    }
}