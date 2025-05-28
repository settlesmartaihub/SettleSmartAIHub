// File: src/modules/conversations/conversations.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConversationsRepository } from './conversations.repository';
import {
    Conversation,
    ConversationStatus,
    WhatsAppMessage,
    MessageType,
    MessageDirection,
} from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { UpdateContextDto } from './dto/update-context.dto';
import { ConversationSearchDto, ConversationStatsDto } from './dto/conversation-search.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ConversationsService {
    constructor(
        private readonly conversationsRepository: ConversationsRepository,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Create a new conversation or get existing active conversation
     */
    async createOrGetActiveConversation(
        createConversationDto: CreateConversationDto,
    ): Promise<Conversation> {
        // Check if user exists, create if not (WhatsApp auto-registration)
        const user = await this.usersService.findByPhoneNumber?.(createConversationDto.user_phone);
        if (!user) {
            // Auto-create user for WhatsApp - FIXED DTO FIELD NAMES
            try {
                await this.usersService.create?.({
                    name: `User ${createConversationDto.user_phone.slice(-4)}`,
                    phone_number: createConversationDto.user_phone, // Use correct field name
                    location: 'Lugbe, Abuja', // Default location
                });
            } catch (error) {
                // If create doesn't exist, we'll skip user creation for now
                console.log('User auto-creation skipped - implement create method in UsersService');
            }
        }

        // Check for existing active conversation
        const existingConversation = await this.conversationsRepository.findActiveByUserPhone(
            createConversationDto.user_phone,
        );

        if (existingConversation) {
            // Reactivate if it was waiting
            if (existingConversation.status !== ConversationStatus.ACTIVE) {
                const reactivated = await this.conversationsRepository.reactivate(existingConversation.id);
                return reactivated || existingConversation;
            }
            return existingConversation;
        }

        // Create new conversation
        return await this.conversationsRepository.create({
            ...createConversationDto,
            session_id: createConversationDto.session_id ||
                this.conversationsRepository.generateSessionId(createConversationDto.user_phone),
        });
    }

    /**
     * Find conversation by ID
     */
    async findById(id: string): Promise<Conversation> {
        const conversation = await this.conversationsRepository.findById(id);
        if (!conversation) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
        return conversation;
    }

    /**
     * Find conversation by session ID
     */
    async findBySessionId(sessionId: string): Promise<Conversation> {
        const conversation = await this.conversationsRepository.findBySessionId(sessionId);
        if (!conversation) {
            throw new NotFoundException(`Conversation with session ID ${sessionId} not found`);
        }
        return conversation;
    }

    /**
     * Find active conversation by user phone
     */
    async findActiveByUserPhone(userPhone: string): Promise<Conversation | null> {
        return await this.conversationsRepository.findActiveByUserPhone(userPhone);
    }

    /**
     * Get conversation history for a user
     */
    async getUserConversationHistory(userPhone: string, limit: number = 10): Promise<Conversation[]> {
        return await this.conversationsRepository.findByUserPhone(userPhone, limit);
    }

    /**
     * Add message to conversation
     */
    async addMessage(conversationId: string, addMessageDto: AddMessageDto): Promise<Conversation> {
        const conversation = await this.findById(conversationId);

        const messageData: Omit<WhatsAppMessage, 'id' | 'timestamp'> = {
            type: addMessageDto.type,
            direction: addMessageDto.direction,
            content: addMessageDto.content,
            sender: addMessageDto.sender,
            metadata: addMessageDto.metadata,
        };

        const updatedConversation = await this.conversationsRepository.addMessage(
            conversationId,
            messageData,
        );

        if (!updatedConversation) {
            throw new NotFoundException(`Failed to add message to conversation ${conversationId}`);
        }

        return updatedConversation;
    }

    /**
     * Add user message (convenience method for WhatsApp integration)
     */
    async addUserMessage(
        userPhone: string,
        content: string,
        messageType: MessageType = MessageType.TEXT,
        metadata?: any,
    ): Promise<Conversation> {
        // Get or create active conversation
        let conversation = await this.conversationsRepository.findActiveByUserPhone(userPhone);

        if (!conversation) {
            // Create new conversation
            conversation = await this.createOrGetActiveConversation({
                user_phone: userPhone,
                session_id: this.conversationsRepository.generateSessionId(userPhone),
            });
        }

        // Add user message
        return await this.addMessage(conversation.id, {
            type: messageType,
            direction: MessageDirection.INCOMING,
            content,
            sender: 'user',
            metadata,
        });
    }

    /**
     * Add AI response message
     */
    async addAIResponse(
        conversationId: string,
        content: string,
        messageType: MessageType = MessageType.TEXT,
        metadata?: any,
    ): Promise<Conversation> {
        return await this.addMessage(conversationId, {
            type: messageType,
            direction: MessageDirection.OUTGOING,
            content,
            sender: 'ai',
            metadata,
        });
    }

    /**
     * Update conversation context
     */
    async updateContext(conversationId: string, updateContextDto: UpdateContextDto): Promise<Conversation> {
        const updatedConversation = await this.conversationsRepository.updateContext(
            conversationId,
            updateContextDto,
        );

        if (!updatedConversation) {
            throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
        }

        return updatedConversation;
    }

    /**
     * Set conversation intent
     */
    async setIntent(conversationId: string, intent: string, stage?: string): Promise<Conversation> {
        return await this.updateContext(conversationId, {
            current_intent: intent,
            conversation_stage: stage,
        });
    }

    /**
     * Set search criteria in conversation context
     */
    async setSearchCriteria(
        conversationId: string,
        criteria: {
            budget_min?: number;
            budget_max?: number;
            bedrooms?: number;
            bathrooms?: number;
            property_types?: string[];
            location_preference?: string;
            required_amenities?: string[];
        },
    ): Promise<Conversation> {
        return await this.updateContext(conversationId, {
            search_criteria: criteria,
        });
    }

    /**
     * Record property recommendations in conversation
     */
    async recordPropertyRecommendations(
        conversationId: string,
        propertyIds: string[],
    ): Promise<Conversation> {
        return await this.updateContext(conversationId, {
            last_property_recommendations: propertyIds,
            last_ai_action: 'property_recommendations_sent',
        });
    }

    /**
     * Record agent matching in conversation
     */
    async recordAgentMatching(
        conversationId: string,
        agentIds: string[],
    ): Promise<Conversation> {
        return await this.updateContext(conversationId, {
            matched_agents: agentIds,
            agent_contacted: agentIds.length > 0,
        });
    }

    /**
     * Mark conversation as waiting for user input
     */
    async markWaitingForUser(conversationId: string): Promise<Conversation> {
        const updatedConversation = await this.conversationsRepository.markWaitingForUser(conversationId);
        if (!updatedConversation) {
            throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
        }
        return updatedConversation;
    }

    /**
     * Mark conversation as completed
     */
    async markCompleted(conversationId: string, reason?: string): Promise<Conversation> {
        const updatedConversation = await this.conversationsRepository.markCompleted(conversationId, reason);
        if (!updatedConversation) {
            throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
        }
        return updatedConversation;
    }

    /**
     * Reactivate conversation
     */
    async reactivate(conversationId: string): Promise<Conversation> {
        const updatedConversation = await this.conversationsRepository.reactivate(conversationId);
        if (!updatedConversation) {
            throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
        }
        return updatedConversation;
    }

    /**
     * Search conversations with filters
     */
    async search(searchDto: ConversationSearchDto): Promise<PaginatedResponse<Conversation>> {
        return await this.conversationsRepository.search(searchDto);
    }

    /**
     * Get conversation statistics
     */
    async getStats(statsDto: ConversationStatsDto): Promise<any> {
        return await this.conversationsRepository.getConversationStats(statsDto.days);
    }

    /**
     * Find stale conversations for cleanup
     */
    async findStaleConversations(hours: number = 24): Promise<Conversation[]> {
        return await this.conversationsRepository.findStaleConversations(hours);
    }

    /**
     * Clean up abandoned conversations
     */
    async cleanupAbandonedConversations(hours: number = 48): Promise<number> {
        const staleConversations = await this.findStaleConversations(hours);
        let cleanedCount = 0;

        for (const conversation of staleConversations) {
            if (!conversation.hasUserEngagement()) {
                await this.markCompleted(conversation.id, 'abandoned');
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    /**
     * Get conversation summary for analytics
     */
    async getConversationSummary(conversationId: string): Promise<any> {
        const conversation = await this.findById(conversationId);
        return conversation.getConversationSummary();
    }

    /**
     * Get user conversation analytics
     */
    async getUserAnalytics(userPhone: string): Promise<any> {
        return await this.conversationsRepository.findForUserAnalytics(userPhone);
    }

    /**
     * Find conversations by intent (for analytics)
     */
    async findByIntent(intent: string, limit: number = 50): Promise<Conversation[]> {
        return await this.conversationsRepository.findByIntent(intent, limit);
    }

    /**
     * Find conversations with property recommendations
     */
    async findWithPropertyRecommendations(): Promise<Conversation[]> {
        return await this.conversationsRepository.findWithPropertyRecommendations();
    }

    /**
     * Update conversation (general update method)
     */
    async update(conversationId: string, updateDto: UpdateConversationDto): Promise<Conversation> {
        const updatedConversation = await this.conversationsRepository.update(conversationId, updateDto);
        if (!updatedConversation) {
            throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
        }
        return updatedConversation;
    }

    /**
     * Delete conversation
     */
    async delete(conversationId: string): Promise<void> {
        const conversation = await this.findById(conversationId);
        const deleted = await this.conversationsRepository.delete(conversationId);
        if (!deleted) {
            throw new BadRequestException(`Failed to delete conversation ${conversationId}`);
        }
    }

    /**
     * WhatsApp Integration Helper Methods
     */

    /**
     * Process incoming WhatsApp message
     */
    async processWhatsAppMessage(
        userPhone: string,
        content: string,
        messageType: MessageType = MessageType.TEXT,
        metadata?: any,
    ): Promise<{
        conversation: Conversation;
        isNewConversation: boolean;
        context: any;
    }> {
        // Check for existing active conversation
        let conversation = await this.findActiveByUserPhone(userPhone);
        const isNewConversation = !conversation;

        // Create or get conversation
        if (!conversation) {
            conversation = await this.createOrGetActiveConversation({
                user_phone: userPhone,
                session_id: this.conversationsRepository.generateSessionId(userPhone),
            });
        }

        // Add user message
        conversation = await this.addUserMessage(userPhone, content, messageType, metadata);

        // Update last activity
        await this.conversationsRepository.updateLastActivity(conversation.id);

        return {
            conversation,
            isNewConversation,
            context: conversation.context,
        };
    }

    /**
     * Generate session ID helper
     */
    generateSessionId(userPhone: string): string {
        return this.conversationsRepository.generateSessionId(userPhone);
    }

    /**
     * Health check for conversations
     */
    async healthCheck(): Promise<{
        total_conversations: number;
        active_conversations: number;
        conversations_today: number;
        average_response_time: string;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await this.getStats({ days: 1 });

        return {
            total_conversations: stats.total,
            active_conversations: stats.active,
            conversations_today: stats.total,
            average_response_time: `${stats.average_duration_minutes} minutes`,
        };
    }

    /**
     * Advanced conversation management methods
     */

    /**
     * Get conversations requiring attention (admin tool)
     */
    async getConversationsRequiringAttention(): Promise<{
        stale_conversations: Conversation[];
        error_conversations: Conversation[];
        high_engagement_conversations: Conversation[];
        abandoned_conversations: Conversation[];
    }> {
        const [
            staleConversations,
            abandonedConversations,
            activeConversations,
        ] = await Promise.all([
            this.findStaleConversations(24),
            this.conversationsRepository.search({
                status: ConversationStatus.ABANDONED,
                page: 1,
                limit: 50,
            }),
            this.conversationsRepository.search({
                status: ConversationStatus.ACTIVE,
                min_messages: 10,
                page: 1,
                limit: 20,
            }),
        ]);

        return {
            stale_conversations: staleConversations,
            error_conversations: [], // Would be populated with error tracking
            high_engagement_conversations: activeConversations.data,
            abandoned_conversations: abandonedConversations.data,
        };
    }

    /**
     * Bulk operations for admin management
     */
    async bulkMarkCompleted(conversationIds: string[], reason?: string): Promise<{
        completed: number;
        failed: string[];
    }> {
        const failed: string[] = [];
        let completed = 0;

        for (const conversationId of conversationIds) {
            try {
                await this.markCompleted(conversationId, reason);
                completed++;
            } catch (error) {
                failed.push(conversationId);
            }
        }

        return { completed, failed };
    }

    /**
     * Export conversation data for analytics
     */
    async exportConversationData(filters?: {
        from_date?: string;
        to_date?: string;
        status?: ConversationStatus;
        min_messages?: number;
    }): Promise<any[]> {
        const searchDto: ConversationSearchDto = {
            page: 1,
            limit: 1000, // Large limit for export
            ...filters,
        };

        const conversations = await this.conversationsRepository.search(searchDto);

        return conversations.data.map(conversation => ({
            id: conversation.id,
            user_phone: conversation.user_phone,
            session_id: conversation.session_id,
            status: conversation.status,
            message_count: conversation.message_count,
            duration_minutes: conversation.duration_minutes,
            created_at: conversation.created_at,
            completed_at: conversation.completed_at,
            last_activity_at: conversation.last_activity_at,
            context: conversation.context,
            summary: conversation.getConversationSummary(),
        }));
    }

    /**
     * Get conversation insights for business intelligence
     */
    async getConversationInsights(days: number = 30): Promise<{
        conversation_volume: { date: string; count: number }[];
        completion_rate: number;
        average_session_length: number;
        most_common_intents: { intent: string; count: number }[];
        user_engagement_score: number;
        peak_hours: { hour: number; count: number }[];
    }> {
        const stats = await this.getStats({ days });
        const conversations = await this.conversationsRepository.search({
            from_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            page: 1,
            limit: 1000,
        });

        // Calculate conversation volume by date
        const volumeByDate: Record<string, number> = {};
        conversations.data.forEach(conv => {
            const date = new Date(conv.created_at).toISOString().split('T')[0];
            volumeByDate[date] = (volumeByDate[date] || 0) + 1;
        });

        const conversationVolume = Object.entries(volumeByDate).map(([date, count]) => ({
            date,
            count,
        }));

        // Calculate completion rate
        const completedCount = conversations.data.filter(
            conv => conv.status === ConversationStatus.COMPLETED
        ).length;
        const completionRate = conversations.data.length > 0
            ? Math.round((completedCount / conversations.data.length) * 100)
            : 0;

        // Calculate average session length
        const completedConversations = conversations.data.filter(conv => conv.completed_at);
        const averageSessionLength = completedConversations.length > 0
            ? Math.round(
                completedConversations.reduce((sum, conv) => sum + conv.duration_minutes, 0) /
                completedConversations.length
            )
            : 0;

        // Most common intents
        const intentCounts: Record<string, number> = {};
        conversations.data.forEach(conv => {
            const intent = conv.context?.current_intent;
            if (intent) {
                intentCounts[intent] = (intentCounts[intent] || 0) + 1;
            }
        });

        const mostCommonIntents = Object.entries(intentCounts)
            .map(([intent, count]) => ({ intent, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // User engagement score (based on message count and completion)
        const avgMessages = conversations.data.length > 0
            ? conversations.data.reduce((sum, conv) => sum + conv.message_count, 0) / conversations.data.length
            : 0;
        const userEngagementScore = Math.round(
            (avgMessages * 10 + completionRate) / 2
        );

        // Peak hours analysis
        const hourCounts: Record<number, number> = {};
        conversations.data.forEach(conv => {
            const hour = new Date(conv.created_at).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        return {
            conversation_volume: conversationVolume,
            completion_rate: completionRate,
            average_session_length: averageSessionLength,
            most_common_intents: mostCommonIntents,
            user_engagement_score: userEngagementScore,
            peak_hours: peakHours,
        };
    }

    /**
     * Conversation workflow management
     */
    async processConversationWorkflow(
        conversationId: string,
        action: 'escalate_to_agent' | 'mark_successful' | 'request_feedback' | 'schedule_followup'
    ): Promise<Conversation> {
        const conversation = await this.findById(conversationId);

        switch (action) {
            case 'escalate_to_agent':
                await this.updateContext(conversationId, {
                    last_ai_action: 'escalated_to_agent',
                    awaiting_user_input: false,
                });
                return await this.markWaitingForUser(conversationId);

            case 'mark_successful':
                await this.addMessage(conversationId, {
                    type: MessageType.SYSTEM,
                    direction: MessageDirection.OUTGOING,
                    content: 'Conversation marked as successful',
                    sender: 'system',
                });
                return await this.markCompleted(conversationId, 'successful');

            case 'request_feedback':
                await this.addMessage(conversationId, {
                    type: MessageType.TEXT,
                    direction: MessageDirection.OUTGOING,
                    content: 'Thank you for using SettleSmart AI! How would you rate your experience?',
                    sender: 'ai',
                });
                return await this.updateContext(conversationId, {
                    last_ai_action: 'feedback_requested',
                    awaiting_user_input: true,
                });

            case 'schedule_followup':
                await this.updateContext(conversationId, {
                    last_ai_action: 'followup_scheduled',
                });
                return conversation;

            default:
                throw new BadRequestException(`Unknown workflow action: ${action}`);
        }
    }

    /**
     * Message analysis and categorization
     */
    async analyzeMessage(conversationId: string, messageContent: string): Promise<{
        intent: string;
        confidence: number;
        entities: { type: string; value: string; confidence: number }[];
        sentiment: 'positive' | 'negative' | 'neutral';
        actionRequired: boolean;
    }> {
        // This would integrate with actual NLP services (OpenAI, etc.)
        // For now, return a basic analysis structure

        const intent = this.extractBasicIntent(messageContent);
        const entities = this.extractBasicEntities(messageContent);
        const sentiment = this.analyzeSentiment(messageContent);

        return {
            intent: intent.name,
            confidence: intent.confidence,
            entities,
            sentiment,
            actionRequired: intent.name !== 'greeting' && intent.name !== 'thanks',
        };
    }

    private extractBasicIntent(message: string): { name: string; confidence: number } {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return { name: 'greeting', confidence: 0.9 };
        }
        if (lowerMessage.includes('house') || lowerMessage.includes('flat') || lowerMessage.includes('property')) {
            return { name: 'property_search', confidence: 0.8 };
        }
        if (lowerMessage.includes('budget') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            return { name: 'budget_inquiry', confidence: 0.8 };
        }
        if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
            return { name: 'thanks', confidence: 0.9 };
        }

        return { name: 'general_inquiry', confidence: 0.6 };
    }

    private extractBasicEntities(message: string): { type: string; value: string; confidence: number }[] {
        const entities: { type: string; value: string; confidence: number }[] = [];

        // Extract price/budget entities
        const priceRegex = /(\d+)k|\₦(\d+)|(\d+)\s*(naira|thousand)/gi;
        const priceMatches = message.match(priceRegex);
        if (priceMatches) {
            priceMatches.forEach(match => {
                entities.push({
                    type: 'price',
                    value: match,
                    confidence: 0.8
                });
            });
        }

        // Extract location entities
        const locationRegex = /(lugbe|kubwa|gwarinpa|wuse|asokoro|maitama|garki)/gi;
        const locationMatches = message.match(locationRegex);
        if (locationMatches) {
            locationMatches.forEach(match => {
                entities.push({
                    type: 'location',
                    value: match,
                    confidence: 0.9
                });
            });
        }

        // Extract bedroom entities
        const bedroomRegex = /(\d+)[\s-]*(bedroom|bed|br)/gi;
        const bedroomMatches = message.match(bedroomRegex);
        if (bedroomMatches) {
            bedroomMatches.forEach(match => {
                entities.push({
                    type: 'bedrooms',
                    value: match,
                    confidence: 0.9
                });
            });
        }

        return entities;
    }

    private analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
        const lowerMessage = message.toLowerCase();

        const positiveWords = ['good', 'great', 'excellent', 'perfect', 'nice', 'amazing', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'frustrated'];

        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
}