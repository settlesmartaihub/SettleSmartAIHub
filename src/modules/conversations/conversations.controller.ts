// File: src/modules/conversations/conversations.controller.ts

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
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { UpdateContextDto } from './dto/update-context.dto';
import { ConversationSearchDto, ConversationStatsDto } from './dto/conversation-search.dto';
import { IsNigerianPhone } from '../../common/decorators/phone-validation.decorator';
import { MessageType } from './entities/conversation.entity';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Create New Conversation',
        description: 'Create a new WhatsApp conversation or get existing active conversation for a user',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Conversation created successfully',
        schema: {
            example: {
                success: true,
                message: 'Conversation created successfully',
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    user_phone: '+2348123456789',
                    session_id: 'sess_20250128_143022_456789',
                    status: 'active',
                    message_count: 0,
                    context: {},
                    messages: [],
                    created_at: '2025-01-28T14:30:22Z',
                    updated_at: '2025-01-28T14:30:22Z'
                },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async create(@Body() createConversationDto: CreateConversationDto) {
        const result = await this.conversationsService.createOrGetActiveConversation(createConversationDto);
        return {
            success: true,
            message: 'Conversation created successfully',
            data: result,
        };
    }

    @Get('search')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Search Conversations',
        description: 'Search conversations with filters and pagination',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversations retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'Conversations retrieved successfully',
                data: {
                    data: [
                        {
                            id: '123e4567-e89b-12d3-a456-426614174000',
                            user_phone: '+2348123456789',
                            session_id: 'sess_20250128_143022_456789',
                            status: 'active',
                            message_count: 5,
                            last_activity_at: '2025-01-28T14:35:00Z'
                        }
                    ],
                    total: 25,
                    page: 1,
                    limit: 10,
                    total_pages: 3
                },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async search(@Query() searchDto: ConversationSearchDto) {
        const result = await this.conversationsService.search(searchDto);
        return {
            success: true,
            message: 'Conversations retrieved successfully',
            data: result,
        };
    }

    @Get('stats')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Conversation Statistics',
        description: 'Get comprehensive conversation statistics and analytics',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation statistics retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'Conversation statistics retrieved successfully',
                data: {
                    total: 150,
                    active: 25,
                    completed: 100,
                    abandoned: 25,
                    average_messages: 8,
                    average_duration_minutes: 15,
                    by_status: {
                        active: 25,
                        completed: 100,
                        abandoned: 25,
                        waiting_user: 0,
                        waiting_agent: 0
                    },
                    by_intent: {
                        property_search: 120,
                        budget_setting: 20,
                        preference_update: 10
                    }
                },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async getStats(@Query() statsDto: ConversationStatsDto) {
        const result = await this.conversationsService.getStats(statsDto);
        return {
            success: true,
            message: 'Conversation statistics retrieved successfully',
            data: result,
        };
    }

    @Get('health')
    @ApiOperation({
        summary: 'Conversation System Health Check',
        description: 'Get health status of conversation system',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Health check completed successfully',
        schema: {
            example: {
                success: true,
                message: 'Conversation system is healthy',
                data: {
                    total_conversations: 150,
                    active_conversations: 25,
                    conversations_today: 12,
                    average_response_time: '15 minutes'
                },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async healthCheck() {
        const result = await this.conversationsService.healthCheck();
        return {
            success: true,
            message: 'Conversation system is healthy',
            data: result,
        };
    }

    @Get('user/:phone')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get User Conversation History',
        description: 'Get conversation history for a specific user phone number',
    })
    @ApiParam({
        name: 'phone',
        description: 'User phone number in Nigerian format',
        example: '+2348123456789',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of conversations to return',
        example: 10,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User conversation history retrieved successfully',
    })
    async getUserHistory(
        @Param('phone') phone: string,
        @Query('limit') limit: number = 10,
    ) {
        const result = await this.conversationsService.getUserConversationHistory(phone, limit);
        return {
            success: true,
            message: 'User conversation history retrieved successfully',
            data: result,
        };
    }

    @Get('user/:phone/analytics')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get User Conversation Analytics',
        description: 'Get detailed analytics for a specific user',
    })
    @ApiParam({
        name: 'phone',
        description: 'User phone number in Nigerian format',
        example: '+2348123456789',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User analytics retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'User analytics retrieved successfully',
                data: {
                    total_conversations: 8,
                    completed_conversations: 6,
                    average_messages_per_conversation: 12,
                    total_properties_viewed: 25,
                    most_common_intent: 'property_search'
                },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async getUserAnalytics(@Param('phone') phone: string) {
        const result = await this.conversationsService.getUserAnalytics(phone);
        return {
            success: true,
            message: 'User analytics retrieved successfully',
            data: result,
        };
    }

    @Get('active/:phone')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Active Conversation for User',
        description: 'Get currently active conversation for a user phone number',
    })
    @ApiParam({
        name: 'phone',
        description: 'User phone number in Nigerian format',
        example: '+2348123456789',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Active conversation retrieved successfully',
    })
    async getActiveByUserPhone(@Param('phone') phone: string) {
        const result = await this.conversationsService.findActiveByUserPhone(phone);
        return {
            success: true,
            message: result ? 'Active conversation found' : 'No active conversation found',
            data: result,
        };
    }

    @Get('intent/:intent')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Find Conversations by Intent',
        description: 'Find conversations filtered by specific intent',
    })
    @ApiParam({
        name: 'intent',
        description: 'Conversation intent to filter by',
        example: 'property_search',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of conversations to return',
        example: 50,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversations by intent retrieved successfully',
    })
    async findByIntent(
        @Param('intent') intent: string,
        @Query('limit') limit: number = 50,
    ) {
        const result = await this.conversationsService.findByIntent(intent, limit);
        return {
            success: true,
            message: 'Conversations by intent retrieved successfully',
            data: result,
        };
    }

    @Get('with-properties')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Find Conversations with Property Recommendations',
        description: 'Find conversations that have property recommendations',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversations with property recommendations retrieved successfully',
    })
    async findWithPropertyRecommendations() {
        const result = await this.conversationsService.findWithPropertyRecommendations();
        return {
            success: true,
            message: 'Conversations with property recommendations retrieved successfully',
            data: result,
        };
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Conversation by ID',
        description: 'Get detailed conversation information by ID',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation retrieved successfully',
    })
    async findById(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.conversationsService.findById(id);
        return {
            success: true,
            message: 'Conversation retrieved successfully',
            data: result,
        };
    }

    @Get('session/:sessionId')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Conversation by Session ID',
        description: 'Get conversation by session identifier',
    })
    @ApiParam({
        name: 'sessionId',
        description: 'Session identifier',
        example: 'sess_20250128_143022_456789',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation retrieved successfully',
    })
    async findBySessionId(@Param('sessionId') sessionId: string) {
        const result = await this.conversationsService.findBySessionId(sessionId);
        return {
            success: true,
            message: 'Conversation retrieved successfully',
            data: result,
        };
    }

    @Get(':id/summary')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Conversation Summary',
        description: 'Get analytics summary for a specific conversation',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation summary retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'Conversation summary retrieved successfully',
                data: {
                    total_messages: 15,
                    user_messages: 8,
                    ai_messages: 7,
                    duration_minutes: 12,
                    intents_detected: ['property_search', 'budget_setting'],
                    properties_shown: 5,
                    agents_contacted: 1
                },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async getConversationSummary(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.conversationsService.getConversationSummary(id);
        return {
            success: true,
            message: 'Conversation summary retrieved successfully',
            data: result,
        };
    }

    @Post(':id/messages')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Add Message to Conversation',
        description: 'Add a new message to existing conversation',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Message added successfully',
    })
    async addMessage(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() addMessageDto: AddMessageDto,
    ) {
        const result = await this.conversationsService.addMessage(id, addMessageDto);
        return {
            success: true,
            message: 'Message added successfully',
            data: result,
        };
    }

    @Post('user/:phone/message')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Add User Message (WhatsApp Integration)',
        description: 'Add user message to conversation, creating conversation if needed',
    })
    @ApiParam({
        name: 'phone',
        description: 'User phone number in Nigerian format',
        example: '+2348123456789',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User message processed successfully',
    })
    async addUserMessage(
        @Param('phone') phone: string,
        @Body() body: { content: string; messageType?: MessageType; metadata?: any },
    ) {
        const result = await this.conversationsService.addUserMessage(
            phone,
            body.content,
            body.messageType || MessageType.TEXT,
            body.metadata,
        );
        return {
            success: true,
            message: 'User message processed successfully',
            data: result,
        };
    }

    @Post(':id/ai-response')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Add AI Response to Conversation',
        description: 'Add AI response message to conversation',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'AI response added successfully',
    })
    async addAIResponse(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { content: string; messageType?: MessageType; metadata?: any },
    ) {
        const result = await this.conversationsService.addAIResponse(
            id,
            body.content,
            body.messageType || MessageType.TEXT,
            body.metadata,
        );
        return {
            success: true,
            message: 'AI response added successfully',
            data: result,
        };
    }

    @Patch(':id/context')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Update Conversation Context',
        description: 'Update conversation context and state',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation context updated successfully',
    })
    async updateContext(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateContextDto: UpdateContextDto,
    ) {
        const result = await this.conversationsService.updateContext(id, updateContextDto);
        return {
            success: true,
            message: 'Conversation context updated successfully',
            data: result,
        };
    }

    @Patch(':id/intent')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Set Conversation Intent',
        description: 'Set conversation intent and stage',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation intent updated successfully',
    })
    async setIntent(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { intent: string; stage?: string },
    ) {
        const result = await this.conversationsService.setIntent(id, body.intent, body.stage);
        return {
            success: true,
            message: 'Conversation intent updated successfully',
            data: result,
        };
    }

    @Patch(':id/search-criteria')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Set Search Criteria',
        description: 'Set property search criteria in conversation context',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Search criteria updated successfully',
    })
    async setSearchCriteria(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() criteria: {
            budget_min?: number;
            budget_max?: number;
            bedrooms?: number;
            bathrooms?: number;
            property_types?: string[];
            location_preference?: string;
            required_amenities?: string[];
        },
    ) {
        const result = await this.conversationsService.setSearchCriteria(id, criteria);
        return {
            success: true,
            message: 'Search criteria updated successfully',
            data: result,
        };
    }

    @Patch(':id/property-recommendations')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Record Property Recommendations',
        description: 'Record property recommendations sent to user',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property recommendations recorded successfully',
    })
    async recordPropertyRecommendations(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { propertyIds: string[] },
    ) {
        const result = await this.conversationsService.recordPropertyRecommendations(
            id,
            body.propertyIds,
        );
        return {
            success: true,
            message: 'Property recommendations recorded successfully',
            data: result,
        };
    }

    @Patch(':id/agent-matching')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Record Agent Matching',
        description: 'Record agent matching and connection',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent matching recorded successfully',
    })
    async recordAgentMatching(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { agentIds: string[] },
    ) {
        const result = await this.conversationsService.recordAgentMatching(id, body.agentIds);
        return {
            success: true,
            message: 'Agent matching recorded successfully',
            data: result,
        };
    }

    @Patch(':id/waiting-user')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Mark Waiting for User',
        description: 'Mark conversation as waiting for user input',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation marked as waiting for user',
    })
    async markWaitingForUser(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.conversationsService.markWaitingForUser(id);
        return {
            success: true,
            message: 'Conversation marked as waiting for user',
            data: result,
        };
    }

    @Patch(':id/complete')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Mark Conversation Complete',
        description: 'Mark conversation as completed or abandoned',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation marked as completed',
    })
    async markCompleted(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { reason?: string },
    ) {
        const result = await this.conversationsService.markCompleted(id, body.reason);
        return {
            success: true,
            message: 'Conversation marked as completed',
            data: result,
        };
    }

    @Patch(':id/reactivate')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Reactivate Conversation',
        description: 'Reactivate a completed or waiting conversation',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation reactivated successfully',
    })
    async reactivate(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.conversationsService.reactivate(id);
        return {
            success: true,
            message: 'Conversation reactivated successfully',
            data: result,
        };
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Update Conversation',
        description: 'Update conversation details',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation updated successfully',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateConversationDto: UpdateConversationDto,
    ) {
        const result = await this.conversationsService.update(id, updateConversationDto);
        return {
            success: true,
            message: 'Conversation updated successfully',
            data: result,
        };
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Delete Conversation',
        description: 'Delete conversation (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Conversation UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Conversation deleted successfully',
    })
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        await this.conversationsService.delete(id);
        return {
            success: true,
            message: 'Conversation deleted successfully',
        };
    }

    @Post('cleanup/abandoned')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Cleanup Abandoned Conversations',
        description: 'Mark stale conversations as abandoned',
    })
    @ApiQuery({
        name: 'hours',
        description: 'Hours of inactivity to consider abandoned',
        example: 48,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Abandoned conversations cleaned up successfully',
        schema: {
            example: {
                success: true,
                message: 'Cleaned up 15 abandoned conversations',
                data: { cleaned_count: 15 },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async cleanupAbandonedConversations(@Query('hours') hours: number = 48) {
        const cleanedCount = await this.conversationsService.cleanupAbandonedConversations(hours);
        return {
            success: true,
            message: `Cleaned up ${cleanedCount} abandoned conversations`,
            data: { cleaned_count: cleanedCount },
        };
    }

    @Get('stale/:hours')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Find Stale Conversations',
        description: 'Find conversations inactive for specified hours',
    })
    @ApiParam({
        name: 'hours',
        description: 'Hours of inactivity',
        example: '24',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Stale conversations retrieved successfully',
    })
    async findStaleConversations(@Param('hours') hours: number) {
        const result = await this.conversationsService.findStaleConversations(hours);
        return {
            success: true,
            message: 'Stale conversations retrieved successfully',
            data: result,
        };
    }
}