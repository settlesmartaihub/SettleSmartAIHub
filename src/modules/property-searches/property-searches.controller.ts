// File name: src/modules/property-searches/property-searches.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
    ApiBody,
} from '@nestjs/swagger';

import { PropertySearchesService } from './property-searches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreatePropertySearchDto } from './dto/create-property-search.dto';
import { SearchAnalyticsDto } from './dto/search-analytics.dto';

@ApiTags('Property Searches')
@Controller('property-searches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PropertySearchesController {
    constructor(private readonly propertySearchesService: PropertySearchesService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Create Property Search Record',
        description: 'Create a new property search record for analytics and tracking'
    })
    @ApiBody({ type: CreatePropertySearchDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Property search created successfully',
        schema: {
            example: {
                success: true,
                message: 'Property search created successfully',
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    user_phone: '+2348123456789',
                    search_criteria: {
                        budget_min: 300000,
                        budget_max: 800000,
                        bedrooms: 2,
                        location_areas: ['Lugbe Phase 1'],
                        required_amenities: ['parking', 'security']
                    },
                    search_results: {
                        total_found: 12,
                        properties_returned: 10,
                        average_score: 78
                    },
                    search_source: 'whatsapp_chat',
                    search_quality: 'good',
                    results_count: 12,
                    average_matching_score: 78.5,
                    created_at: '2025-06-01T10:30:00Z'
                },
                timestamp: '2025-06-01T10:30:00Z'
            }
        }
    })
    async createPropertySearch(@Body() createPropertySearchDto: CreatePropertySearchDto) {
        const result = await this.propertySearchesService.createPropertySearch(createPropertySearchDto);
        return {
            success: true,
            message: 'Property search created successfully',
            data: result,
        };
    }

    @Get('analytics')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Search Analytics',
        description: 'Get comprehensive search analytics and insights (Admin only)'
    })
    @ApiQuery({
        name: 'days',
        description: 'Number of days to analyze',
        example: 30,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Search analytics retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'Search analytics retrieved successfully',
                data: {
                    total_searches: 245,
                    successful_searches: 198,
                    average_results_per_search: 8,
                    average_matching_score: 72,
                    by_source: {
                        whatsapp_chat: 180,
                        manual_search: 45,
                        ai_recommendation: 20
                    },
                    conversion_metrics: {
                        properties_viewed_rate: 65,
                        agents_contacted_rate: 28,
                        follow_up_searches_rate: 35
                    }
                },
                timestamp: '2025-06-01T10:30:00Z'
            }
        }
    })
    async getSearchAnalytics(@Query('days') days: number = 30) {
        const result = await this.propertySearchesService.getSearchAnalytics(days);
        return {
            success: true,
            message: 'Search analytics retrieved successfully',
            data: result,
        };
    }

    @Get('report')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Generate Search Report',
        description: 'Generate comprehensive search report with insights and recommendations'
    })
    @ApiQuery({
        name: 'days',
        description: 'Number of days to include in report',
        example: 30,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Search report generated successfully'
    })
    async generateSearchReport(@Query('days') days: number = 30) {
        const result = await this.propertySearchesService.generateSearchReport(days);
        return {
            success: true,
            message: 'Search report generated successfully',
            data: result,
        };
    }

    @Get('user/:phone/history')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get User Search History',
        description: 'Get search history for a specific user'
    })
    @ApiParam({
        name: 'phone',
        description: 'User phone number',
        example: '+2348123456789',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of searches to return',
        example: 20,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User search history retrieved successfully'
    })
    async getUserSearchHistory(
        @Param('phone') phone: string,
        @Query('limit') limit: number = 20,
    ) {
        const result = await this.propertySearchesService.getUserSearchHistory(phone, limit);
        return {
            success: true,
            message: 'User search history retrieved successfully',
            data: result,
        };
    }

    @Get('user/:phone/patterns')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get User Search Patterns',
        description: 'Analyze user search patterns and preferences'
    })
    @ApiParam({
        name: 'phone',
        description: 'User phone number',
        example: '+2348123456789',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User search patterns retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'User search patterns retrieved successfully',
                data: {
                    total_searches: 15,
                    successful_searches: 12,
                    favorite_budget_range: { min: 400000, max: 800000 },
                    preferred_bedrooms: 2,
                    preferred_locations: ['Lugbe Phase 1', 'Lugbe Phase 2'],
                    most_searched_amenities: ['parking', 'security', 'power'],
                    search_frequency_days: 7
                },
                timestamp: '2025-06-01T10:30:00Z'
            }
        }
    })
    async getUserSearchPatterns(@Param('phone') phone: string) {
        const result = await this.propertySearchesService.getUserSearchPatterns(phone);
        return {
            success: true,
            message: 'User search patterns retrieved successfully',
            data: result,
        };
    }

    @Get('user/:phone/recent')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Recent User Searches',
        description: 'Get recent searches by user within specified hours'
    })
    @ApiParam({
        name: 'phone',
        description: 'User phone number',
        example: '+2348123456789',
    })
    @ApiQuery({
        name: 'hours',
        description: 'Hours to look back',
        example: 24,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Recent searches retrieved successfully'
    })
    async getRecentSearchesByUser(
        @Param('phone') phone: string,
        @Query('hours') hours: number = 24,
    ) {
        const result = await this.propertySearchesService.getRecentSearchesByUser(phone, hours);
        return {
            success: true,
            message: 'Recent searches retrieved successfully',
            data: result,
        };
    }

    @Get('search')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Search Property Searches',
        description: 'Search property searches with advanced filters'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property searches retrieved successfully'
    })
    async searchWithAnalytics(@Query() analyticsDto: SearchAnalyticsDto) {
        const result = await this.propertySearchesService.searchWithAnalytics(analyticsDto);
        return {
            success: true,
            message: 'Property searches retrieved successfully',
            data: result,
        };
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Property Search by ID',
        description: 'Get detailed property search information'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property search retrieved successfully'
    })
    async findById(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.propertySearchesService.findById(id);
        return {
            success: true,
            message: 'Property search retrieved successfully',
            data: result,
        };
    }

    @Get(':id/similar')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Find Similar Searches',
        description: 'Find searches similar to the specified search'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of similar searches to return',
        example: 10,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Similar searches retrieved successfully'
    })
    async findSimilarSearches(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('limit') limit: number = 10,
    ) {
        const result = await this.propertySearchesService.findSimilarSearches(id, limit);
        return {
            success: true,
            message: 'Similar searches retrieved successfully',
            data: result,
        };
    }

    @Get(':id/analysis')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Analyze Search Performance',
        description: 'Get detailed performance analysis for a specific search'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Search analysis completed successfully',
        schema: {
            example: {
                success: true,
                message: 'Search analysis completed successfully',
                data: {
                    quality_score: 78,
                    engagement_metrics: {
                        properties_viewed: 3,
                        agents_contacted: 1,
                        time_spent_minutes: 15,
                        satisfaction_rating: 4
                    },
                    conversion_indicators: {
                        viewed_properties: 3,
                        contacted_agents: 1,
                        has_follow_up: true
                    },
                    recommendations: [
                        'Excellent user engagement',
                        'Search criteria well defined'
                    ]
                },
                timestamp: '2025-06-01T10:30:00Z'
            }
        }
    })
    async analyzeSearchPerformance(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.propertySearchesService.analyzeSearchPerformance(id);
        return {
            success: true,
            message: 'Search analysis completed successfully',
            data: result,
        };
    }

    @Post(':id/view-property')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Record Property View',
        description: 'Record that user viewed a property from search results'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                property_id: {
                    type: 'string',
                    example: '123e4567-e89b-12d3-a456-426614174000'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property view recorded successfully'
    })
    async recordPropertyView(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('property_id') propertyId: string,
    ) {
        const result = await this.propertySearchesService.recordPropertyView(id, propertyId);
        return {
            success: true,
            message: 'Property view recorded successfully',
            data: result,
        };
    }

    @Post(':id/contact-agent')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Record Agent Contact',
        description: 'Record that user contacted an agent from search results'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                agent_id: {
                    type: 'string',
                    example: '123e4567-e89b-12d3-a456-426614174000'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent contact recorded successfully'
    })
    async recordAgentContact(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('agent_id') agentId: string,
    ) {
        const result = await this.propertySearchesService.recordAgentContact(id, agentId);
        return {
            success: true,
            message: 'Agent contact recorded successfully',
            data: result,
        };
    }

    @Post(':id/satisfaction')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Record User Satisfaction',
        description: 'Record user satisfaction rating for search results'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                rating: {
                    type: 'number',
                    minimum: 1,
                    maximum: 5,
                    example: 4
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Satisfaction rating recorded successfully'
    })
    async recordSatisfactionRating(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('rating') rating: number,
    ) {
        const result = await this.propertySearchesService.recordSatisfactionRating(id, rating);
        return {
            success: true,
            message: 'Satisfaction rating recorded successfully',
            data: result,
        };
    }

    @Post('bulk-analyze')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Bulk Analyze Searches',
        description: 'Analyze multiple searches for collective insights'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                search_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    example: [
                        '123e4567-e89b-12d3-a456-426614174000',
                        '123e4567-e89b-12d3-a456-426614174001'
                    ]
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Bulk analysis completed successfully'
    })
    async bulkAnalyzeSearches(@Body('search_ids') searchIds: string[]) {
        const result = await this.propertySearchesService.bulkAnalyzeSearches(searchIds);
        return {
            success: true,
            message: 'Bulk analysis completed successfully',
            data: result,
        };
    }

    @Post('from-conversation')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Create Search from Conversation',
        description: 'Create search record from WhatsApp conversation'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                user_phone: { type: 'string', example: '+2348123456789' },
                conversation_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                original_query: { type: 'string', example: 'I need a 2-bedroom flat in Lugbe under 800k' },
                search_criteria: { type: 'object' },
                search_results: { type: 'object' },
                execution_time_ms: { type: 'number', example: 250 }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Search created from conversation successfully'
    })
    async createSearchFromConversation(@Body() body: {
        user_phone: string;
        conversation_id: string;
        original_query: string;
        search_criteria: any;
        search_results: any;
        execution_time_ms?: number;
    }) {
        const result = await this.propertySearchesService.createSearchFromConversation(
            body.user_phone,
            body.conversation_id,
            body.original_query,
            body.search_criteria,
            body.search_results,
            body.execution_time_ms
        );
        return {
            success: true,
            message: 'Search created from conversation successfully',
            data: result,
        };
    }

    @Patch(':id/ai-insights')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Update Search with AI Insights',
        description: 'Update search with AI-generated insights and analysis'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                intent_confidence: { type: 'number', example: 0.95 },
                extracted_entities: { type: 'object' },
                suggested_refinements: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['Consider increasing budget by 10%', 'Expand location radius']
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Search updated with AI insights successfully'
    })
    async updateSearchWithAIInsights(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: {
            intent_confidence: number;
            extracted_entities: Record<string, any>;
            suggested_refinements: string[];
        }
    ) {
        const result = await this.propertySearchesService.updateSearchWithAIInsights(
            id,
            body.intent_confidence,
            body.extracted_entities,
            body.suggested_refinements
        );
        return {
            success: true,
            message: 'Search updated with AI insights successfully',
            data: result,
        };
    }

    @Delete('cleanup/:days')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Cleanup Old Searches',
        description: 'Delete old search records older than specified days'
    })
    @ApiParam({
        name: 'days',
        description: 'Days old threshold for deletion',
        example: '180',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Old searches cleaned up successfully',
        schema: {
            example: {
                success: true,
                message: 'Deleted 45 old search records',
                data: { deleted_count: 45 },
                timestamp: '2025-06-01T10:30:00Z'
            }
        }
    })
    async cleanupOldSearches(@Param('days') days: number) {
        const deletedCount = await this.propertySearchesService.cleanupOldSearches(days);
        return {
            success: true,
            message: `Deleted ${deletedCount} old search records`,
            data: { deleted_count: deletedCount },
        };
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Delete Property Search',
        description: 'Delete specific property search record (Admin only)'
    })
    @ApiParam({
        name: 'id',
        description: 'Property search UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property search deleted successfully'
    })
    async deleteSearch(@Param('id', ParseUUIDPipe) id: string) {
        await this.propertySearchesService.deleteSearch(id);
        return {
            success: true,
            message: 'Property search deleted successfully',
        };
    }
}