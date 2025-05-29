// File name: src/agents/agents.controller.ts

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
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateAgentDto } from '../../modules/agents/dto/create-agent.dto';
import { UpdateAgentDto } from '../../modules/agents/dto/update-agent.dto';
import { VerifyAgentDto } from '../../modules/agents/dto/verify-agent.dto';
import { UpdateSubscriptionDto } from '../../modules/agents/dto/update-subscription.dto';
import { RateAgentDto } from '../../modules/agents/dto/rate-agent.dto';
import { AgentSearchDto } from '../../modules/agents/dto/agent-search.dto';
import { AgentPropertiesFilterDto } from '../../modules/agents/dto/agent-properties-filter.dto';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AgentsController {
    constructor(private readonly agentsService: AgentsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Create New Agent',
        description: 'Create a new real estate agent account (Admin only)',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Agent created successfully',
        schema: {
            example: {
                success: true,
                message: 'Agent created successfully',
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'John Doe',
                    phone_number: '+2348123456789',
                    email: 'john.doe@example.com',
                    status: 'pending',
                    subscription: 'basic',
                    rating: 0,
                    properties_count: 0,
                    created_at: '2025-01-28T14:30:22Z'
                },
                timestamp: '2025-01-28T14:30:22Z'
            }
        }
    })
    async create(@Body() createAgentDto: CreateAgentDto) {
        const result = await this.agentsService.create(createAgentDto);
        return {
            success: true,
            message: 'Agent created successfully',
            data: result,
        };
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get All Agents',
        description: 'Get paginated list of agents with filters',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agents retrieved successfully',
    })
    async findAll(@Query() searchDto: AgentSearchDto) {
        const result = await this.agentsService.findAll(searchDto);
        return {
            success: true,
            message: 'Agents retrieved successfully',
            data: result,
        };
    }

    @Get('statistics')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Agent Statistics',
        description: 'Get comprehensive agent statistics (Admin only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent statistics retrieved successfully',
    })
    async getStatistics() {
        const result = await this.agentsService.getAgentStatistics();
        return {
            success: true,
            message: 'Agent statistics retrieved successfully',
            data: result,
        };
    }

    @Get('top-performers')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Top Performing Agents',
        description: 'Get list of top performing agents by rating and conversion',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of agents to return',
        example: 10,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Top performing agents retrieved successfully',
    })
    async getTopPerformers(@Query('limit') limit: number = 10) {
        const result = await this.agentsService.findTopPerformingAgents(limit);
        return {
            success: true,
            message: 'Top performing agents retrieved successfully',
            data: result,
        };
    }

    @Get('needing-attention')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Agents Needing Attention',
        description: 'Get agents with issues that need admin attention',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agents needing attention retrieved successfully',
    })
    async getAgentsNeedingAttention() {
        const result = await this.agentsService.findAgentsNeedingAttention();
        return {
            success: true,
            message: 'Agents needing attention retrieved successfully',
            data: result,
        };
    }

    @Get('me/dashboard')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Agent Dashboard',
        description: 'Get comprehensive dashboard data for current agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent dashboard retrieved successfully',
    })
    async getMyDashboard(@CurrentUser() user: any) {
        const result = await this.agentsService.getDashboardSummary(user.id);
        return {
            success: true,
            message: 'Agent dashboard retrieved successfully',
            data: result,
        };
    }

    @Get('me')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Current Agent Profile',
        description: 'Get current authenticated agent profile',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent profile retrieved successfully',
    })
    async getMyProfile(@CurrentUser() user: any) {
        const result = await this.agentsService.findById(user.id);
        return {
            success: true,
            message: 'Agent profile retrieved successfully',
            data: result,
        };
    }

    @Get('me/analytics')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Get My Analytics',
        description: 'Get analytics for current authenticated agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent analytics retrieved successfully',
    })
    async getMyAnalytics(@CurrentUser() user: any) {
        const result = await this.agentsService.getAgentAnalytics(user.id);
        return {
            success: true,
            message: 'Agent analytics retrieved successfully',
            data: result,
        };
    }

    @Get('me/leads')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Get My Leads',
        description: 'Get leads for current authenticated agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent leads retrieved successfully',
    })
    async getMyLeads(@CurrentUser() user: any) {
        const result = await this.agentsService.getAgentLeads(user.id);
        return {
            success: true,
            message: 'Agent leads retrieved successfully',
            data: result,
        };
    }

    @Get('me/performance')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Get My Performance',
        description: 'Get performance data over time for current agent',
    })
    @ApiQuery({
        name: 'days',
        description: 'Number of days to analyze',
        example: 30,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent performance retrieved successfully',
    })
    async getMyPerformance(
        @CurrentUser() user: any,
        @Query('days') days: number = 30,
    ) {
        const result = await this.agentsService.getAgentPerformance(user.id, days);
        return {
            success: true,
            message: 'Agent performance retrieved successfully',
            data: result,
        };
    }

    @Get('me/subscription')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Get My Subscription',
        description: 'Get subscription details and limits for current agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Subscription details retrieved successfully',
    })
    async getMySubscription(@CurrentUser() user: any) {
        const result = await this.agentsService.checkSubscriptionLimits(user.id);
        return {
            success: true,
            message: 'Subscription details retrieved successfully',
            data: result,
        };
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Agent by ID',
        description: 'Get specific agent details by ID',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent retrieved successfully',
    })
    async findById(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.agentsService.findById(id);
        return {
            success: true,
            message: 'Agent retrieved successfully',
            data: result,
        };
    }

    @Get(':id/analytics')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Agent Analytics',
        description: 'Get detailed analytics for specific agent (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent analytics retrieved successfully',
    })
    async getAgentAnalytics(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.agentsService.getAgentAnalytics(id);
        return {
            success: true,
            message: 'Agent analytics retrieved successfully',
            data: result,
        };
    }

    @Get(':id/properties')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Get Agent Properties',
        description: 'Get properties listed by specific agent',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent properties retrieved successfully',
    })
    async getAgentProperties(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() filterDto: AgentPropertiesFilterDto,
    ) {
        const result = await this.agentsService.getAgentProperties(id, filterDto);
        return {
            success: true,
            message: 'Agent properties retrieved successfully',
            data: result,
        };
    }

    @Get(':id/leads')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Agent Leads',
        description: 'Get leads for specific agent (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent leads retrieved successfully',
    })
    async getAgentLeads(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.agentsService.getAgentLeads(id);
        return {
            success: true,
            message: 'Agent leads retrieved successfully',
            data: result,
        };
    }

    @Get(':id/dashboard')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get Agent Dashboard',
        description: 'Get dashboard summary for specific agent (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent dashboard retrieved successfully',
    })
    async getAgentDashboard(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.agentsService.getDashboardSummary(id);
        return {
            success: true,
            message: 'Agent dashboard retrieved successfully',
            data: result,
        };
    }

    @Patch('me')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Update My Profile',
        description: 'Update current authenticated agent profile',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent profile updated successfully',
    })
    async updateMyProfile(
        @CurrentUser() user: any,
        @Body() updateAgentDto: UpdateAgentDto,
    ) {
        const result = await this.agentsService.update(user.id, updateAgentDto);
        return {
            success: true,
            message: 'Agent profile updated successfully',
            data: result,
        };
    }

    @Patch('me/subscription')
    @Roles(UserRole.AGENT)
    @ApiOperation({
        summary: 'Update My Subscription',
        description: 'Update subscription plan for current agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Subscription updated successfully',
    })
    async updateMySubscription(
        @CurrentUser() user: any,
        @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    ) {
        const result = await this.agentsService.updateSubscription(user.id, updateSubscriptionDto);
        return {
            success: true,
            message: 'Subscription updated successfully',
            data: result,
        };
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Update Agent',
        description: 'Update specific agent details (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent updated successfully',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAgentDto: UpdateAgentDto,
    ) {
        const result = await this.agentsService.update(id, updateAgentDto);
        return {
            success: true,
            message: 'Agent updated successfully',
            data: result,
        };
    }

    @Patch(':id/verify')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Verify Agent',
        description: 'Verify or reject agent application (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent verification updated successfully',
    })
    async verifyAgent(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() verifyAgentDto: VerifyAgentDto,
    ) {
        const result = await this.agentsService.verifyAgent(id, verifyAgentDto);
        return {
            success: true,
            message: 'Agent verification updated successfully',
            data: result,
        };
    }

    @Patch(':id/subscription')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Update Agent Subscription',
        description: 'Update agent subscription plan (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent subscription updated successfully',
    })
    async updateAgentSubscription(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    ) {
        const result = await this.agentsService.updateSubscription(id, updateSubscriptionDto);
        return {
            success: true,
            message: 'Agent subscription updated successfully',
            data: result,
        };
    }

    @Patch(':id/rate')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({
        summary: 'Rate Agent',
        description: 'Rate an agent based on service quality',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent rated successfully',
    })
    async rateAgent(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() rateAgentDto: RateAgentDto,
    ) {
        const result = await this.agentsService.rateAgent(id, rateAgentDto);
        return {
            success: true,
            message: 'Agent rated successfully',
            data: result,
        };
    }

    @Patch(':id/suspend')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Suspend Agent',
        description: 'Suspend agent account (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent suspended successfully',
    })
    async suspendAgent(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { reason?: string },
    ) {
        const result = await this.agentsService.suspend(id, body.reason);
        return {
            success: true,
            message: 'Agent suspended successfully',
            data: result,
        };
    }

    @Patch(':id/reactivate')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Reactivate Agent',
        description: 'Reactivate suspended agent account (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent reactivated successfully',
    })
    async reactivateAgent(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.agentsService.reactivate(id);
        return {
            success: true,
            message: 'Agent reactivated successfully',
            data: result,
        };
    }

    @Post(':id/notify')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Send Notification to Agent',
        description: 'Send notification to specific agent (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Notification sent successfully',
    })
    async sendNotification(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { message: string; type: 'sms' | 'email' | 'whatsapp' },
    ) {
        await this.agentsService.sendNotification(id, body.message, body.type);
        return {
            success: true,
            message: 'Notification sent successfully',
        };
    }

    @Post('bulk-update')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Bulk Update Agents',
        description: 'Update multiple agents at once (Admin only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Bulk update completed',
    })
    async bulkUpdate(
        @Body() body: { agentIds: string[]; updateData: any },
    ) {
        const result = await this.agentsService.bulkUpdate(body.agentIds, body.updateData);
        return {
            success: true,
            message: `Bulk update completed: ${result.updated} updated, ${result.failed.length} failed`,
            data: result,
        };
    }

    @Get('export/data')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Export Agents Data',
        description: 'Export all agents data for analytics (Admin only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agents data exported successfully',
    })
    async exportData() {
        const result = await this.agentsService.exportAgentsData();
        return {
            success: true,
            message: 'Agents data exported successfully',
            data: result,
        };
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Delete Agent',
        description: 'Delete agent account permanently (Admin only)',
    })
    @ApiParam({
        name: 'id',
        description: 'Agent UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent deleted successfully',
    })
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        await this.agentsService.delete(id);
        return {
            success: true,
            message: 'Agent deleted successfully',
        };
    }

    @Post('statistics/update')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Update Agent Statistics',
        description: 'Recalculate and update statistics for all agents (Admin only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent statistics updated successfully',
    })
    async updateStatistics() {
        return {
            success: true,
            message: 'Agent statistics update initiated',
            data: {
                status: 'in_progress',
                estimated_completion: '5 minutes'
            },
        };
    }
}