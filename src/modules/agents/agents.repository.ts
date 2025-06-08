// File name    : src/modules/agents/agents.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import {
    Agent,
    AgentStatus,
    AgentVerificationStatus,
    AgentSubscriptionTier,
} from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentSearchDto } from './dto/agent-search.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class AgentsRepository {
    constructor(
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
    ) { }

    // Create a new agent
    async create(createAgentDto: CreateAgentDto): Promise<Agent> {
        const agent = this.agentRepository.create({
            ...createAgentDto,
            verification_status: AgentVerificationStatus.PENDING,
            status: AgentStatus.ACTIVE,
            subscription_tier: AgentSubscriptionTier.BASIC,
            rating: 0,
            total_ratings: 0,
            successful_leads: 0,
            total_leads: 0,
        });
        return await this.agentRepository.save(agent);
    }

    // Find agent by ID
    async findById(id: string): Promise<Agent | null> {
        return await this.agentRepository.findOne({
            where: { id },
            relations: ['properties'],
        });
    }

    // Find agent by phone number
    async findByPhone(phoneNumber: string): Promise<Agent | null> {
        return await this.agentRepository.findOne({
            where: { phone_number: phoneNumber },
            relations: ['properties'],
        });
    }

    // Find agent by email
    async findByEmail(email: string): Promise<Agent | null> {
        return await this.agentRepository.findOne({
            where: { email },
            relations: ['properties'],
        });
    }

    // Update agent
    async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent | null> {
        await this.agentRepository.update(id, updateAgentDto);
        return await this.findById(id);
    }

    // Delete agent
    async delete(id: string): Promise<boolean> {
        const result = await this.agentRepository.delete(id);
        return (result.affected || 0) > 0;
    }

    // Search agents with filters and pagination
    async search(searchDto: AgentSearchDto): Promise<PaginatedResponse<Agent>> {
        const {
            name,
            phone_number,
            email,
            status,
            verification_status,
            subscription_tier,
            location,
            min_rating,
            max_rating,
            page = 1,
            limit = 10,
            sort_by = 'created_at',
            sort_order = 'DESC',
        } = searchDto;

        const queryBuilder = this.agentRepository
            .createQueryBuilder('agent')
            .leftJoinAndSelect('agent.properties', 'properties');

        // Apply filters
        if (name) {
            queryBuilder.andWhere('LOWER(agent.name) LIKE LOWER(:name)', { name: `%${name}%` });
        }

        if (phone_number) {
            queryBuilder.andWhere('agent.phone_number = :phone_number', { phone_number });
        }

        if (email) {
            queryBuilder.andWhere('LOWER(agent.email) LIKE LOWER(:email)', { email: `%${email}%` });
        }

        if (status) {
            queryBuilder.andWhere('agent.status = :status', { status });
        }

        if (verification_status) {
            queryBuilder.andWhere('agent.verification_status = :verification_status', { verification_status });
        }

        if (subscription_tier) {
            queryBuilder.andWhere('agent.subscription_tier = :subscription_tier', { subscription_tier });
        }

        if (location) {
            queryBuilder.andWhere('LOWER(agent.location) LIKE LOWER(:location)', {
                location: `%${location}%`,
            });
        }

        if (min_rating !== undefined) {
            queryBuilder.andWhere('agent.rating >= :min_rating', { min_rating });
        }

        if (max_rating !== undefined) {
            queryBuilder.andWhere('agent.rating <= :max_rating', { max_rating });
        }

        // Apply sorting
        const validSortFields = ['created_at', 'updated_at', 'name', 'rating', 'total_ratings'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        queryBuilder.orderBy(`agent.${sortField}`, sort_order as 'ASC' | 'DESC');

        // Apply pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

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

    // Find all agents with basic pagination
    async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Agent>> {
        const [agents, total] = await this.agentRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { created_at: 'DESC' },
            relations: ['properties'],
        });

        return {
            data: agents,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    // Find active agents
    async findActiveAgents(): Promise<Agent[]> {
        return await this.agentRepository.find({
            where: {
                status: AgentStatus.ACTIVE,
                verification_status: AgentVerificationStatus.VERIFIED,
            },
            relations: ['properties'],
            order: { rating: 'DESC', created_at: 'DESC' },
        });
    }

    // Find agents needing verification
    async findPendingVerification(): Promise<Agent[]> {
        return await this.agentRepository.find({
            where: { verification_status: AgentVerificationStatus.PENDING },
            order: { created_at: 'ASC' },
        });
    }

    // Find top performing agents
    async findTopPerformingAgents(limit: number = 10): Promise<Agent[]> {
        return await this.agentRepository.find({
            where: {
                status: AgentStatus.ACTIVE,
                verification_status: AgentVerificationStatus.VERIFIED,
            },
            order: {
                rating: 'DESC',
                total_ratings: 'DESC',
                successful_leads: 'DESC',
            },
            take: limit,
            relations: ['properties'],
        });
    }

    // Find agents needing attention
    async findAgentsNeedingAttention(): Promise<{
        low_rated_agents: Agent[];
        inactive_agents: Agent[];
        agents_without_properties: Agent[];
        expired_subscriptions: Agent[];
    }> {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [lowRatedAgents, inactiveAgents, agentsWithoutProperties] = await Promise.all([
            // Agents with rating below 3.0 and at least 5 ratings
            this.agentRepository.find({
                where: {
                    status: AgentStatus.ACTIVE,
                    verification_status: AgentVerificationStatus.VERIFIED,
                },
                order: { rating: 'ASC' },
                take: 20,
            }).then(agents => agents.filter(agent => agent.rating < 3.0 && agent.total_ratings >= 5)),

            // Agents inactive for more than a week
            this.agentRepository.find({
                where: [
                    { status: AgentStatus.INACTIVE },
                    {
                        status: AgentStatus.ACTIVE,
                        last_activity: LessThan(oneWeekAgo),
                    },
                ],
                order: { last_activity: 'ASC' },
                take: 20,
            }),

            // Active agents without properties
            this.agentRepository
                .createQueryBuilder('agent')
                .leftJoin('agent.properties', 'properties')
                .where('agent.status = :status', { status: AgentStatus.ACTIVE })
                .andWhere('agent.verification_status = :verification', { verification: AgentVerificationStatus.VERIFIED })
                .andWhere('properties.id IS NULL')
                .orderBy('agent.created_at', 'ASC')
                .getMany(),
        ]);

        // Find agents with expired premium subscriptions
        const expiredSubscriptions = await this.agentRepository.find({
            where: {
                subscription_tier: AgentSubscriptionTier.PREMIUM,
                subscription_expires_at: LessThan(new Date()),
            },
            order: { subscription_expires_at: 'ASC' },
        });

        return {
            low_rated_agents: lowRatedAgents,
            inactive_agents: inactiveAgents,
            agents_without_properties: agentsWithoutProperties,
            expired_subscriptions: expiredSubscriptions,
        };
    }

    // Get agent statistics
    async getAgentStatistics(): Promise<{
        total_agents: number;
        active_agents: number;
        pending_agents: number;
        suspended_agents: number;
        rejected_agents: number;
        basic_subscription: number;
        premium_subscription: number;
        average_rating: number;
        agents_by_location: Record<string, number>;
        agents_by_rating_range: Record<string, number>;
        subscription_expiry_this_month: number;
    }> {
        const [
            totalAgents,
            activeAgents,
            pendingAgents,
            suspendedAgents,
            rejectedAgents,
            basicSubscription,
            premiumSubscription,
            averageRatingResult,
        ] = await Promise.all([
            this.agentRepository.count(),
            this.agentRepository.count({ where: { status: AgentStatus.ACTIVE } }),
            this.agentRepository.count({ where: { verification_status: AgentVerificationStatus.PENDING } }),
            this.agentRepository.count({ where: { status: AgentStatus.SUSPENDED } }),
            this.agentRepository.count({ where: { verification_status: AgentVerificationStatus.REJECTED } }),
            this.agentRepository.count({ where: { subscription_tier: AgentSubscriptionTier.BASIC } }),
            this.agentRepository.count({ where: { subscription_tier: AgentSubscriptionTier.PREMIUM } }),
            this.agentRepository
                .createQueryBuilder('agent')
                .select('AVG(agent.rating)', 'avg_rating')
                .where('agent.total_ratings > 0')
                .getRawOne(),
        ]);

        // Get agents by location
        const locationStats = await this.agentRepository
            .createQueryBuilder('agent')
            .select('agent.location', 'location')
            .addSelect('COUNT(*)', 'count')
            .where('agent.location IS NOT NULL')
            .groupBy('agent.location')
            .getRawMany();

        const agentsByLocation: Record<string, number> = {};
        locationStats.forEach(({ location, count }) => {
            agentsByLocation[location] = parseInt(count, 10);
        });

        // Get agents by rating range
        const ratingRangeStats = await this.agentRepository
            .createQueryBuilder('agent')
            .select(`
                CASE 
                    WHEN agent.rating >= 4.5 THEN 'Excellent (4.5+)'
                    WHEN agent.rating >= 4.0 THEN 'Very Good (4.0-4.4)'
                    WHEN agent.rating >= 3.5 THEN 'Good (3.5-3.9)'
                    WHEN agent.rating >= 3.0 THEN 'Average (3.0-3.4)'
                    WHEN agent.rating > 0 THEN 'Below Average (<3.0)'
                    ELSE 'Not Rated'
                END
            `, 'rating_range')
            .addSelect('COUNT(*)', 'count')
            .groupBy('rating_range')
            .getRawMany();

        const agentsByRatingRange: Record<string, number> = {};
        ratingRangeStats.forEach(({ rating_range, count }) => {
            agentsByRatingRange[rating_range] = parseInt(count, 10);
        });

        // Count subscriptions expiring this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const subscriptionExpiryThisMonth = await this.agentRepository.count({
            where: {
                subscription_tier: AgentSubscriptionTier.PREMIUM,
                subscription_expires_at: Between(startOfMonth, endOfMonth),
            },
        });

        return {
            total_agents: totalAgents,
            active_agents: activeAgents,
            pending_agents: pendingAgents,
            suspended_agents: suspendedAgents,
            rejected_agents: rejectedAgents,
            basic_subscription: basicSubscription,
            premium_subscription: premiumSubscription,
            average_rating: Math.round((parseFloat(averageRatingResult?.avg_rating) || 0) * 100) / 100,
            agents_by_location: agentsByLocation,
            agents_by_rating_range: agentsByRatingRange,
            subscription_expiry_this_month: subscriptionExpiryThisMonth,
        };
    }

    // Update agent last activity
    async updateLastActivity(id: string): Promise<void> {
        await this.agentRepository.update(id, {
            last_activity: new Date(),
        });
    }

    // Increment agent leads
    async incrementTotalLeads(id: string): Promise<void> {
        await this.agentRepository.increment({ id }, 'total_leads', 1);
    }

    async incrementSuccessfulLeads(id: string): Promise<void> {
        await this.agentRepository.increment({ id }, 'successful_leads', 1);
    }

    // Update agent rating
    async updateRating(id: string, newRating: number): Promise<Agent | null> {
        const agent = await this.findById(id);
        if (!agent) return null;

        const totalScore = agent.rating * agent.total_ratings + newRating;
        const newTotalRatings = agent.total_ratings + 1;
        const newAverageRating = Math.round((totalScore / newTotalRatings) * 100) / 100;

        await this.agentRepository.update(id, {
            rating: newAverageRating,
            total_ratings: newTotalRatings,
        });

        return await this.findById(id);
    }

    // Verify agent
    async verifyAgent(id: string, verificationStatus: AgentVerificationStatus, notes?: string): Promise<Agent | null> {
        const updateData: Partial<Agent> = {
            verification_status: verificationStatus,
        };

        // If verified, also set status to active
        if (verificationStatus === AgentVerificationStatus.VERIFIED) {
            updateData.status = AgentStatus.ACTIVE;
        }

        await this.agentRepository.update(id, updateData);
        return await this.findById(id);
    }

    // Update subscription
    async updateSubscription(
        id: string,
        subscriptionTier: AgentSubscriptionTier,
        expiresAt?: Date
    ): Promise<Agent | null> {
        const updateData: Partial<Agent> = {
            subscription_tier: subscriptionTier,
        };

        if (subscriptionTier === AgentSubscriptionTier.PREMIUM && expiresAt) {
            updateData.subscription_expires_at = expiresAt;
        } else if (subscriptionTier === AgentSubscriptionTier.BASIC) {
            // Explicitly handle null assignment with type assertion
            updateData.subscription_expires_at = null as any;
        }

        await this.agentRepository.update(id, updateData);
        return await this.findById(id);
    }

    // Suspend agent
    async suspendAgent(id: string, reason?: string): Promise<Agent | null> {
        await this.agentRepository.update(id, {
            status: AgentStatus.SUSPENDED,
            verification_status: AgentVerificationStatus.SUSPENDED,
        });
        return await this.findById(id);
    }

    // Reactivate agent
    async reactivateAgent(id: string): Promise<Agent | null> {
        await this.agentRepository.update(id, {
            status: AgentStatus.ACTIVE,
            verification_status: AgentVerificationStatus.VERIFIED,
        });
        return await this.findById(id);
    }

    // Find agents by location
    async findByLocation(location: string, limit: number = 20): Promise<Agent[]> {
        return await this.agentRepository.find({
            where: {
                location: location,
                status: AgentStatus.ACTIVE,
                verification_status: AgentVerificationStatus.VERIFIED,
            },
            order: { rating: 'DESC', total_ratings: 'DESC' },
            take: limit,
            relations: ['properties'],
        });
    }

    // Find agents by subscription tier
    async findBySubscriptionTier(tier: AgentSubscriptionTier): Promise<Agent[]> {
        return await this.agentRepository.find({
            where: { subscription_tier: tier },
            order: { created_at: 'DESC' },
            relations: ['properties'],
        });
    }

    // Find agents with expiring subscriptions
    async findWithExpiringSubscriptions(days: number = 7): Promise<Agent[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return await this.agentRepository.find({
            where: {
                subscription_tier: AgentSubscriptionTier.PREMIUM,
                subscription_expires_at: Between(new Date(), futureDate),
            },
            order: { subscription_expires_at: 'ASC' },
        });
    }

    // Bulk operations
    async bulkUpdateStatus(agentIds: string[], status: AgentStatus): Promise<{ updated: number; failed: string[] }> {
        const failed: string[] = [];
        let updated = 0;

        for (const agentId of agentIds) {
            try {
                const result = await this.agentRepository.update(agentId, { status });
                if (result.affected && result.affected > 0) {
                    updated++;
                } else {
                    failed.push(agentId);
                }
            } catch (error) {
                failed.push(agentId);
            }
        }

        return { updated, failed };
    }

    async bulkUpdateVerificationStatus(
        agentIds: string[],
        verificationStatus: AgentVerificationStatus
    ): Promise<{ updated: number; failed: string[] }> {
        const failed: string[] = [];
        let updated = 0;

        for (const agentId of agentIds) {
            try {
                const result = await this.agentRepository.update(agentId, {
                    verification_status: verificationStatus,
                });
                if (result.affected && result.affected > 0) {
                    updated++;
                } else {
                    failed.push(agentId);
                }
            } catch (error) {
                failed.push(agentId);
            }
        }

        return { updated, failed };
    }

    // Analytics and reporting
    async getAgentPerformanceMetrics(id: string, days: number = 30): Promise<{
        leads_generated: number;
        successful_conversions: number;
        conversion_rate: number;
        average_response_time_hours: number;
        properties_listed: number;
        total_inquiries: number;
        rating_trend: number;
    }> {
        const agent = await this.findById(id);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        // TODO: Replace with actual data
        // This would normally involve querying related tables for leads, conversations, etc.
        // For now, we'll return calculated values based on available data
        const propertiesCount = agent.properties?.length || 0;
        const totalInquiries = agent.properties?.reduce((sum, prop) => sum + (prop.inquiry_count || 0), 0) || 0;

        return {
            leads_generated: agent.total_leads,
            successful_conversions: agent.successful_leads,
            conversion_rate: agent.conversion_rate,
            average_response_time_hours: 2.5, // This would be calculated from actual response data
            properties_listed: propertiesCount,
            total_inquiries: totalInquiries,
            rating_trend: 0.1, // This would be calculated from rating history
        };
    }

    async getAgentLeadsAnalytics(id: string): Promise<{
        total_leads: number;
        hot_leads: number;
        warm_leads: number;
        cold_leads: number;
        converted_leads: number;
        leads_this_week: number;
        leads_this_month: number;
        lead_sources: Record<string, number>;
    }> {
        const agent = await this.findById(id);
        if (!agent) {
            throw new Error('Agent not found');
        }

        // TODO: Replace this with actual data
        // This would normally query leads/conversations tables
        // For now, we'll return mock data based on agent stats
        const totalLeads = agent.total_leads;
        const convertedLeads = agent.successful_leads;

        return {
            total_leads: totalLeads,
            hot_leads: Math.round(totalLeads * 0.2),
            warm_leads: Math.round(totalLeads * 0.3),
            cold_leads: Math.round(totalLeads * 0.5),
            converted_leads: convertedLeads,
            leads_this_week: Math.round(totalLeads * 0.1),
            leads_this_month: Math.round(totalLeads * 0.4),
            lead_sources: {
                whatsapp: Math.round(totalLeads * 0.7),
                direct_contact: Math.round(totalLeads * 0.2),
                referral: Math.round(totalLeads * 0.1),
            },
        };
    }

    // Export data for analytics
    async exportAgentsData(filters?: {
        status?: AgentStatus;
        verification_status?: AgentVerificationStatus;
        subscription_tier?: AgentSubscriptionTier;
        location?: string;
        created_after?: Date;
        created_before?: Date;
    }): Promise<any[]> {
        const queryBuilder = this.agentRepository.createQueryBuilder('agent');

        if (filters) {
            if (filters.status) {
                queryBuilder.andWhere('agent.status = :status', { status: filters.status });
            }
            if (filters.verification_status) {
                queryBuilder.andWhere('agent.verification_status = :verification_status', {
                    verification_status: filters.verification_status
                });
            }
            if (filters.subscription_tier) {
                queryBuilder.andWhere('agent.subscription_tier = :subscription_tier', {
                    subscription_tier: filters.subscription_tier
                });
            }
            if (filters.location) {
                queryBuilder.andWhere('LOWER(agent.location) LIKE LOWER(:location)', {
                    location: `%${filters.location}%`
                });
            }
            if (filters.created_after) {
                queryBuilder.andWhere('agent.created_at >= :created_after', {
                    created_after: filters.created_after
                });
            }
            if (filters.created_before) {
                queryBuilder.andWhere('agent.created_at <= :created_before', {
                    created_before: filters.created_before
                });
            }
        }

        const agents = await queryBuilder
            .orderBy('agent.created_at', 'DESC')
            .getMany();

        return agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            phone_number: agent.phone_number,
            email: agent.email,
            business_name: agent.business_name,
            location: agent.location,
            status: agent.status,
            verification_status: agent.verification_status,
            subscription_tier: agent.subscription_tier,
            rating: agent.rating,
            total_ratings: agent.total_ratings,
            total_leads: agent.total_leads,
            successful_leads: agent.successful_leads,
            conversion_rate: agent.conversion_rate,
            created_at: agent.created_at,
            updated_at: agent.updated_at,
            last_activity: agent.last_activity,
            subscription_expires_at: agent.subscription_expires_at,
        }));
    }

    // Check subscription limits
    async checkSubscriptionLimits(id: string): Promise<{
        can_add_property: boolean;
        properties_used: number;
        properties_limit: number;
        subscription_type: string;
        expires_at?: Date | null;
        days_until_expiry?: number;
    }> {
        const agent = await this.agentRepository.findOne({
            where: { id },
            relations: ['properties'],
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        const propertiesUsed = agent.properties?.length || 0;
        const propertiesLimit = agent.subscription_tier === AgentSubscriptionTier.PREMIUM ? 100 : 5;
        const canAddProperty = propertiesUsed < propertiesLimit;

        let daysUntilExpiry: number | undefined;
        if (agent.subscription_expires_at) {
            const now = new Date();
            const expiryDate = new Date(agent.subscription_expires_at);
            daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
            can_add_property: canAddProperty,
            properties_used: propertiesUsed,
            properties_limit: propertiesLimit,
            subscription_type: agent.subscription_tier,
            expires_at: agent.subscription_expires_at || null,
            days_until_expiry: daysUntilExpiry,
        };
    }

    // Dashboard summary for agent
    async getDashboardSummary(id: string): Promise<{
        agent_info: Partial<Agent>;
        properties_count: number;
        active_properties: number;
        total_leads: number;
        successful_leads: number;
        conversion_rate: number;
        rating: number;
        total_ratings: number;
        subscription_info: any;
        recent_activity: Date | null;
    }> {
        const agent = await this.agentRepository.findOne({
            where: { id },
            relations: ['properties'],
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        const propertiesCount = agent.properties?.length || 0;
        const activeProperties = agent.properties?.filter(p => p.status === 'available').length || 0;
        const subscriptionInfo = await this.checkSubscriptionLimits(id);

        return {
            agent_info: {
                id: agent.id,
                name: agent.name,
                email: agent.email,
                phone_number: agent.phone_number,
                business_name: agent.business_name,
                location: agent.location,
                status: agent.status,
                verification_status: agent.verification_status,
            },
            properties_count: propertiesCount,
            active_properties: activeProperties,
            total_leads: agent.total_leads,
            successful_leads: agent.successful_leads,
            conversion_rate: agent.conversion_rate,
            rating: agent.rating,
            total_ratings: agent.total_ratings,
            subscription_info: subscriptionInfo,
            recent_activity: agent.last_activity || null, // Handle undefined case
        };
    }
}