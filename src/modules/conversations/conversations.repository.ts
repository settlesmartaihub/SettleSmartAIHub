// File name: src/modules/conversations/conversations.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import {
    Conversation,
    ConversationStatus,
    WhatsAppMessage,
    ConversationContext,
} from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationSearchDto } from './dto/conversation-search.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class ConversationsRepository {
    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
    ) { }

    // Create a new conversation
    async create(createConversationDto: CreateConversationDto): Promise<Conversation> {
        const conversation = this.conversationRepository.create({
            ...createConversationDto,
            messages: createConversationDto.messages || [],
            context: createConversationDto.context || {},
            status: createConversationDto.status || ConversationStatus.ACTIVE,
            message_count: createConversationDto.messages?.length || 0,
        });

        return await this.conversationRepository.save(conversation);
    }

    // Find conversation by ID
    async findById(id: string): Promise<Conversation | null> {
        return await this.conversationRepository.findOne({
            where: { id },
            relations: ['user'],
        });
    }

    // Find conversation by session ID
    async findBySessionId(sessionId: string): Promise<Conversation | null> {
        return await this.conversationRepository.findOne({
            where: { session_id: sessionId },
            relations: ['user'],
        });
    }

    // Find active conversation by user phone
    async findActiveByUserPhone(userPhone: string): Promise<Conversation | null> {
        return await this.conversationRepository.findOne({
            where: {
                user_phone: userPhone,
                status: ConversationStatus.ACTIVE,
            },
            relations: ['user'],
            order: { updated_at: 'DESC' },
        });
    }

    // Find conversations by user phone
    async findByUserPhone(
        userPhone: string,
        limit: number = 10,
    ): Promise<Conversation[]> {
        return await this.conversationRepository.find({
            where: { user_phone: userPhone },
            relations: ['user'],
            order: { created_at: 'DESC' },
            take: limit,
        });
    }

    // Update conversation
    async update(
        id: string,
        updateConversationDto: UpdateConversationDto,
    ): Promise<Conversation | null> {
        // Create a proper update object that matches the entity structure
        const updateData: any = {};

        if (updateConversationDto.status) {
            updateData.status = updateConversationDto.status;
        }
        if (updateConversationDto.context) {
            updateData.context = updateConversationDto.context;
        }
        if (updateConversationDto.messages) {
            updateData.messages = updateConversationDto.messages;
        }
        if (updateConversationDto.user_phone) {
            updateData.user_phone = updateConversationDto.user_phone;
        }
        if (updateConversationDto.session_id) {
            updateData.session_id = updateConversationDto.session_id;
        }

        await this.conversationRepository.update(id, updateData);
        return await this.findById(id);
    }

    // Add message to conversation
    async addMessage(
        id: string,
        message: Omit<WhatsAppMessage, 'id' | 'timestamp'>,
    ): Promise<Conversation | null> {
        const conversation = await this.findById(id);
        if (!conversation) return null;

        conversation.addMessage(message);
        return await this.conversationRepository.save(conversation);
    }

    // Update conversation context
    async updateContext(
        id: string,
        contextUpdate: Partial<ConversationContext>,
    ): Promise<Conversation | null> {
        const conversation = await this.findById(id);
        if (!conversation) return null;

        conversation.updateContext(contextUpdate);
        return await this.conversationRepository.save(conversation);
    }


    // Search conversations with filters and pagination
    async search(searchDto: ConversationSearchDto): Promise<PaginatedResponse<Conversation>> {
        const {
            user_phone,
            session_id,
            status,
            from_date,
            to_date,
            min_messages,
            max_messages,
            intent,
            page = 1,
            limit = 10,
        } = searchDto;

        const queryBuilder = this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.user', 'user');

        // Apply filters
        if (user_phone) {
            queryBuilder.andWhere('conversation.user_phone = :user_phone', { user_phone });
        }

        if (session_id) {
            queryBuilder.andWhere('conversation.session_id = :session_id', { session_id });
        }

        if (status) {
            queryBuilder.andWhere('conversation.status = :status', { status });
        }

        if (from_date) {
            queryBuilder.andWhere('conversation.created_at >= :from_date', { from_date });
        }

        if (to_date) {
            queryBuilder.andWhere('conversation.created_at <= :to_date', { to_date });
        }

        if (min_messages !== undefined) {
            queryBuilder.andWhere('conversation.message_count >= :min_messages', { min_messages });
        }

        if (max_messages !== undefined) {
            queryBuilder.andWhere('conversation.message_count <= :max_messages', { max_messages });
        }

        if (intent) {
            queryBuilder.andWhere("conversation.context->>'current_intent' = :intent", { intent });
        }

        // Add pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        // Add ordering
        queryBuilder.orderBy('conversation.updated_at', 'DESC');

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

    // Mark conversation as completed
    async markCompleted(id: string, reason?: string): Promise<Conversation | null> {
        const conversation = await this.findById(id);
        if (!conversation) return null;

        conversation.markCompleted(reason);
        return await this.conversationRepository.save(conversation);
    }

    // Mark conversation as waiting for user
    async markWaitingForUser(id: string): Promise<Conversation | null> {
        const conversation = await this.findById(id);
        if (!conversation) return null;

        conversation.markWaitingForUser();
        return await this.conversationRepository.save(conversation);
    }

    // Reactivate conversation
    async reactivate(id: string): Promise<Conversation | null> {
        const conversation = await this.findById(id);
        if (!conversation) return null;

        conversation.reactivate();
        return await this.conversationRepository.save(conversation);
    }

    // Find stale conversations (inactive for specified hours)
    async findStaleConversations(hours: number = 24): Promise<Conversation[]> {
        const staleTime = new Date();
        staleTime.setHours(staleTime.getHours() - hours);

        return await this.conversationRepository.find({
            where: {
                status: ConversationStatus.ACTIVE,
                last_activity_at: Between(new Date('2000-01-01'), staleTime),
            },
            relations: ['user'],
            order: { last_activity_at: 'ASC' },
        });
    }

    // Find conversations by intent
    async findByIntent(intent: string, limit: number = 50): Promise<Conversation[]> {
        return await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.user', 'user')
            .where("conversation.context->>'current_intent' = :intent", { intent })
            .orderBy('conversation.updated_at', 'DESC')
            .take(limit)
            .getMany();
    }

    // Find conversations with property recommendations
    async findWithPropertyRecommendations(): Promise<Conversation[]> {
        return await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.user', 'user')
            .where("conversation.context->'last_property_recommendations' IS NOT NULL")
            .andWhere("jsonb_array_length(conversation.context->'last_property_recommendations') > 0")
            .orderBy('conversation.updated_at', 'DESC')
            .getMany();
    }

    // Get conversation statistics
    async getConversationStats(days: number = 7): Promise<{
        total: number;
        active: number;
        completed: number;
        abandoned: number;
        average_messages: number;
        average_duration_minutes: number;
        by_status: Record<ConversationStatus, number>;
        by_intent: Record<string, number>;
    }> {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const [
            total,
            active,
            completed,
            abandoned,
            averageData,
        ] = await Promise.all([
            this.conversationRepository.count({
                where: { created_at: MoreThan(fromDate) },
            }),
            this.conversationRepository.count({
                where: {
                    created_at: MoreThan(fromDate),
                    status: ConversationStatus.ACTIVE,
                },
            }),
            this.conversationRepository.count({
                where: {
                    created_at: MoreThan(fromDate),
                    status: ConversationStatus.COMPLETED,
                },
            }),
            this.conversationRepository.count({
                where: {
                    created_at: MoreThan(fromDate),
                    status: ConversationStatus.ABANDONED,
                },
            }),
            this.conversationRepository
                .createQueryBuilder('conversation')
                .select('AVG(conversation.message_count)', 'avg_messages')
                .addSelect('AVG(EXTRACT(EPOCH FROM (conversation.completed_at - conversation.created_at))/60)', 'avg_duration')
                .where('conversation.created_at > :fromDate', { fromDate })
                .andWhere('conversation.completed_at IS NOT NULL')
                .getRawOne(),
        ]);

        // Get status distribution
        const statusStats = await this.conversationRepository
            .createQueryBuilder('conversation')
            .select('conversation.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('conversation.created_at > :fromDate', { fromDate })
            .groupBy('conversation.status')
            .getRawMany();

        const byStatus = Object.values(ConversationStatus).reduce((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {} as Record<ConversationStatus, number>);

        statusStats.forEach(({ status, count }) => {
            byStatus[status] = parseInt(count, 10);
        });

        // Get intent distribution
        const intentStats = await this.conversationRepository
            .createQueryBuilder('conversation')
            .select("conversation.context->>'current_intent'", 'intent')
            .addSelect('COUNT(*)', 'count')
            .where('conversation.created_at > :fromDate', { fromDate })
            .andWhere("conversation.context->>'current_intent' IS NOT NULL")
            .groupBy("conversation.context->>'current_intent'")
            .getRawMany();

        const byIntent: Record<string, number> = {};
        intentStats.forEach(({ intent, count }) => {
            if (intent) {
                byIntent[intent] = parseInt(count, 10);
            }
        });

        return {
            total,
            active,
            completed,
            abandoned,
            average_messages: Math.round(parseFloat(averageData?.avg_messages) || 0),
            average_duration_minutes: Math.round(parseFloat(averageData?.avg_duration) || 0),
            by_status: byStatus,
            by_intent: byIntent,
        };
    }

    // Delete old conversations
    async deleteOldConversations(daysOld: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.conversationRepository.delete({
            created_at: Between(new Date('2000-01-01'), cutoffDate),
            status: ConversationStatus.ABANDONED,
        });

        return result.affected || 0;
    }

    // Find conversations for user analytics
    async findForUserAnalytics(userPhone: string): Promise<{
        total_conversations: number;
        completed_conversations: number;
        average_messages_per_conversation: number;
        total_properties_viewed: number;
        most_common_intent: string | null;
    }> {
        const conversations = await this.conversationRepository.find({
            where: { user_phone: userPhone },
        });

        if (conversations.length === 0) {
            return {
                total_conversations: 0,
                completed_conversations: 0,
                average_messages_per_conversation: 0,
                total_properties_viewed: 0,
                most_common_intent: null,
            };
        }

        const completed = conversations.filter(c => c.status === ConversationStatus.COMPLETED).length;
        const totalMessages = conversations.reduce((sum, c) => sum + c.message_count, 0);
        const totalPropertiesViewed = conversations.reduce((sum, c) => {
            return sum + (c.context.last_property_recommendations?.length || 0);
        }, 0);

        // Find most common intent
        const intentCounts: Record<string, number> = {};
        conversations.forEach(c => {
            const intent = c.context.current_intent;
            if (intent) {
                intentCounts[intent] = (intentCounts[intent] || 0) + 1;
            }
        });

        const mostCommonIntent = Object.keys(intentCounts).length > 0
            ? Object.keys(intentCounts).reduce((a, b) => intentCounts[a] > intentCounts[b] ? a : b)
            : null;

        return {
            total_conversations: conversations.length,
            completed_conversations: completed,
            average_messages_per_conversation: Math.round(totalMessages / conversations.length),
            total_properties_viewed: totalPropertiesViewed,
            most_common_intent: mostCommonIntent,
        };
    }

    // Delete conversation
    async delete(id: string): Promise<boolean> {
        const result = await this.conversationRepository.delete(id);
        return (result.affected || 0) > 0;
    }

    // Update last activity for conversation
    async updateLastActivity(id: string): Promise<void> {
        await this.conversationRepository.update(id, {
            last_activity_at: new Date(),
        });
    }

    // Generate session ID for new conversation
    generateSessionId(userPhone: string): string {
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const phoneDigits = userPhone.replace(/\D/g, '').slice(-6);
        return `sess_${timestamp}_${phoneDigits}`;
    }
}