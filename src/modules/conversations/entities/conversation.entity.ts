// Filename: src/modules/conversations/entities/conversation.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum ConversationStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned',
    WAITING_USER = 'waiting_user',
    WAITING_AGENT = 'waiting_agent',
}

export enum MessageType {
    TEXT = 'text',
    VOICE = 'voice',
    IMAGE = 'image',
    LOCATION = 'location',
    SYSTEM = 'system',
}

export enum MessageDirection {
    INCOMING = 'incoming', // From user to AI
    OUTGOING = 'outgoing', // From AI to user
}

export interface WhatsAppMessage {
    id: string;
    type: MessageType;
    direction: MessageDirection;
    content: string;
    timestamp: string;
    sender: 'user' | 'ai' | 'system';
    metadata?: {
        voice_duration?: number;
        image_url?: string;
        location?: {
            latitude: number;
            longitude: number;
            address?: string;
        };
        button_response?: string;
        list_response?: string;
    };
}

export interface ConversationContext {
    // User Intent & State
    current_intent?: string; // 'property_search', 'budget_setting', 'preference_update'
    conversation_stage?: string; // 'greeting', 'budget_collection', 'preference_collection', 'property_matching'

    // Property Search Context
    search_criteria?: {
        budget_min?: number;
        budget_max?: number;
        bedrooms?: number;
        bathrooms?: number;
        property_types?: string[];
        location_preference?: string;
        required_amenities?: string[];
    };

    // Last AI Response Context
    last_ai_action?: string;
    last_property_recommendations?: string[]; // Property IDs
    awaiting_user_input?: boolean;

    // Session Management
    session_start_time?: string;
    last_activity_time?: string;
    message_count?: number;

    // Agent Connection Context
    matched_agents?: string[]; // Agent IDs
    agent_contacted?: boolean;

    // Personalization
    user_preferences_collected?: boolean;
    budget_set?: boolean;
    location_confirmed?: boolean;
}

@Entity('conversations')
@Index(['user_phone'])
@Index(['session_id'], { unique: true })
@Index(['status'])
@Index(['created_at'])
@Index(['updated_at'])
export class Conversation {
    @ApiProperty({
        description: 'Unique identifier for the conversation',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'User phone number (foreign key to users)',
        example: '+2348123456789',
    })
    @Column({
        type: 'varchar',
        length: 20,
        comment: 'Nigerian phone number in international format',
    })
    user_phone: string;

    @ApiProperty({
        description: 'Unique session identifier for this conversation',
        example: 'sess_20250125_123456_8123456789',
    })
    @Column({
        type: 'varchar',
        length: 100,
        unique: true,
        comment: 'Unique session ID for conversation tracking',
    })
    session_id: string;

    @ApiProperty({
        description: 'Array of WhatsApp messages in this conversation',
        type: 'array',
        items: {
            type: 'object',
        },
    })
    @Column({
        type: 'jsonb',
        default: '[]',
        comment: 'Array of messages with metadata',
    })
    messages: WhatsAppMessage[];

    @ApiProperty({
        description: 'Current conversation context and state',
        example: {
            current_intent: 'property_search',
            conversation_stage: 'budget_collection',
            search_criteria: { budget_min: 200000, budget_max: 800000 }
        },
    })
    @Column({
        type: 'jsonb',
        default: '{}',
        comment: 'Conversation context for AI processing',
    })
    context: ConversationContext;

    @ApiProperty({
        description: 'Current conversation status',
        enum: ConversationStatus,
        example: ConversationStatus.ACTIVE,
    })
    @Column({
        type: 'enum',
        enum: ConversationStatus,
        default: ConversationStatus.ACTIVE,
        comment: 'Current conversation status',
    })
    status: ConversationStatus;

    @ApiProperty({
        description: 'Total number of messages in conversation',
        example: 15,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Total message count for analytics',
    })
    message_count: number;

    @ApiProperty({
        description: 'Last activity timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    @Column({
        type: 'timestamp',
        nullable: true,
        comment: 'Last message timestamp',
    })
    last_activity_at?: Date;

    @ApiProperty({
        description: 'Conversation completion timestamp',
    })
    @Column({
        type: 'timestamp',
        nullable: true,
        comment: 'When conversation was completed or abandoned',
    })
    completed_at?: Date;

    @ApiProperty({
        description: 'Conversation creation timestamp',
    })
    @CreateDateColumn({
        comment: 'Conversation start timestamp',
    })
    created_at: Date;

    @ApiProperty({
        description: 'Last conversation update timestamp',
    })
    @UpdateDateColumn({
        comment: 'Last conversation update timestamp',
    })
    updated_at: Date;

    // Relationships
    @ManyToOne(() => User, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_phone', referencedColumnName: 'phone_number' })
    user: User;

    // Computed properties
    get is_active(): boolean {
        return this.status === ConversationStatus.ACTIVE;
    }

    get duration_minutes(): number {
        if (!this.completed_at) return 0;
        const start = new Date(this.created_at).getTime();
        const end = new Date(this.completed_at).getTime();
        return Math.round((end - start) / (1000 * 60));
    }

    get has_messages(): boolean {
        return this.messages && this.messages.length > 0;
    }

    get last_message(): WhatsAppMessage | null {
        if (!this.has_messages) return null;
        return this.messages[this.messages.length - 1];
    }

    get user_message_count(): number {
        return this.messages.filter(msg => msg.sender === 'user').length;
    }

    get ai_message_count(): number {
        return this.messages.filter(msg => msg.sender === 'ai').length;
    }

    // Helper methods
    addMessage(message: Omit<WhatsAppMessage, 'id' | 'timestamp'>): void {
        const newMessage: WhatsAppMessage = {
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
        };

        if (!this.messages) {
            this.messages = [];
        }

        this.messages.push(newMessage);
        this.message_count = this.messages.length;
        this.last_activity_at = new Date();
    }

    updateContext(contextUpdate: Partial<ConversationContext>): void {
        this.context = {
            ...this.context,
            ...contextUpdate,
            last_activity_time: new Date().toISOString(),
        };
    }

    setIntent(intent: string, stage?: string): void {
        this.updateContext({
            current_intent: intent,
            conversation_stage: stage,
        });
    }

    setSearchCriteria(criteria: Partial<ConversationContext['search_criteria']>): void {
        this.updateContext({
            search_criteria: {
                ...this.context.search_criteria,
                ...criteria,
            },
        });
    }

    markCompleted(reason?: string): void {
        this.status = reason === 'abandoned'
            ? ConversationStatus.ABANDONED
            : ConversationStatus.COMPLETED;
        this.completed_at = new Date();

        if (reason) {
            this.addMessage({
                type: MessageType.SYSTEM,
                direction: MessageDirection.OUTGOING,
                content: `Conversation ${reason}`,
                sender: 'system',
            });
        }
    }

    markWaitingForUser(): void {
        this.status = ConversationStatus.WAITING_USER;
        this.updateContext({ awaiting_user_input: true });
    }

    markWaitingForAgent(): void {
        this.status = ConversationStatus.WAITING_AGENT;
    }

    reactivate(): void {
        if (this.status !== ConversationStatus.ACTIVE) {
            this.status = ConversationStatus.ACTIVE;
            this.updateContext({ awaiting_user_input: false });
        }
    }

    // Analytics methods
    getConversationSummary(): {
        total_messages: number;
        user_messages: number;
        ai_messages: number;
        duration_minutes: number;
        intents_detected: string[];
        properties_shown: number;
        agents_contacted: number;
    } {
        const intentsDetected = this.messages
            .filter(msg => msg.sender === 'system' && msg.content.includes('Intent:'))
            .map(msg => msg.content.replace('Intent: ', ''));

        return {
            total_messages: this.message_count,
            user_messages: this.user_message_count,
            ai_messages: this.ai_message_count,
            duration_minutes: this.duration_minutes,
            intents_detected: [...new Set(intentsDetected)],
            properties_shown: this.context.last_property_recommendations?.length || 0,
            agents_contacted: this.context.matched_agents?.length || 0,
        };
    }

    // Search for specific message types
    getMessagesByType(type: MessageType): WhatsAppMessage[] {
        return this.messages.filter(msg => msg.type === type);
    }

    getMessagesBySender(sender: 'user' | 'ai' | 'system'): WhatsAppMessage[] {
        return this.messages.filter(msg => msg.sender === sender);
    }

    // Check conversation health
    isStale(hours: number = 24): boolean {
        if (!this.last_activity_at) return false;
        const staleTime = new Date();
        staleTime.setHours(staleTime.getHours() - hours);
        return new Date(this.last_activity_at) < staleTime;
    }

    hasUserEngagement(): boolean {
        return this.user_message_count > 1;
    }

    isProductive(): boolean {
        // Conversation is productive if user has set budget or preferences
        return !!(
            this.context.budget_set ||
            this.context.user_preferences_collected ||
            (this.context.last_property_recommendations && this.context.last_property_recommendations.length > 0)
        );
    }
}