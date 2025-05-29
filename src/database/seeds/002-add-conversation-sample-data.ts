// File name: src/database/seeds/002-add-conversation-sample-data.ts

import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Conversation, ConversationStatus, MessageType, MessageDirection } from '../../modules/conversations/entities/conversation.entity';

export async function seedConversations(dataSource: DataSource) {
    const conversationRepository = dataSource.getRepository(Conversation);
    const userRepository = dataSource.getRepository(User);

    // Get existing users
    const users = await userRepository.find({ take: 5 });

    if (users.length === 0) {
        console.log('No users found for conversation seeding');
        return;
    }

    const conversations = [
        {
            user_phone: users[0].phone_number,
            session_id: 'sess_20250128_140000_456789',
            status: ConversationStatus.ACTIVE,
            messages: [
                {
                    id: 'msg_1706455200_abc123',
                    type: MessageType.TEXT,
                    direction: MessageDirection.INCOMING,
                    content: 'Hello, I need help finding a property',
                    timestamp: '2025-01-28T14:00:00Z',
                    sender: 'user' as const,
                },
                {
                    id: 'msg_1706455260_def456',
                    type: MessageType.TEXT,
                    direction: MessageDirection.OUTGOING,
                    content: 'Hello! I\'d be happy to help you find the perfect property. What type of property are you looking for?',
                    timestamp: '2025-01-28T14:01:00Z',
                    sender: 'ai' as const,
                },
                {
                    id: 'msg_1706455320_ghi789',
                    type: MessageType.TEXT,
                    direction: MessageDirection.INCOMING,
                    content: 'I need a 2-bedroom flat in Lugbe under 800k monthly',
                    timestamp: '2025-01-28T14:02:00Z',
                    sender: 'user' as const,
                },
            ],
            context: {
                current_intent: 'property_search',
                conversation_stage: 'criteria_collection',
                search_criteria: {
                    budget_max: 800000,
                    bedrooms: 2,
                    location_preference: 'Lugbe',
                    property_types: ['flat'],
                },
                user_preferences_collected: true,
                budget_set: true,
                location_confirmed: true,
            },
            message_count: 3,
            last_activity_at: new Date('2025-01-28T14:02:00Z'),
        },
        {
            user_phone: users[1].phone_number,
            session_id: 'sess_20250128_150000_567890',
            status: ConversationStatus.COMPLETED,
            messages: [
                {
                    id: 'msg_1706458800_jkl012',
                    type: MessageType.TEXT,
                    direction: MessageDirection.INCOMING,
                    content: 'Hi, I\'m looking for a house to rent',
                    timestamp: '2025-01-28T15:00:00Z',
                    sender: 'user' as const,
                },
                {
                    id: 'msg_1706458860_mno345',
                    type: MessageType.TEXT,
                    direction: MessageDirection.OUTGOING,
                    content: 'Great! I can help you find a house. What\'s your budget range?',
                    timestamp: '2025-01-28T15:01:00Z',
                    sender: 'ai' as const,
                },
            ],
            context: {
                current_intent: 'property_search',
                conversation_stage: 'completed',
                search_criteria: {
                    property_types: ['house'],
                },
                agent_contacted: true,
                matched_agents: ['agent_123'],
            },
            message_count: 2,
            last_activity_at: new Date('2025-01-28T15:01:00Z'),
            completed_at: new Date('2025-01-28T15:30:00Z'),
        },
        {
            user_phone: users[2].phone_number,
            session_id: 'sess_20250127_160000_678901',
            status: ConversationStatus.ABANDONED,
            messages: [
                {
                    id: 'msg_1706372400_pqr678',
                    type: MessageType.TEXT,
                    direction: MessageDirection.INCOMING,
                    content: 'Hello',
                    timestamp: '2025-01-27T16:00:00Z',
                    sender: 'user' as const,
                },
            ],
            context: {
                current_intent: 'greeting',
                conversation_stage: 'initial',
            },
            message_count: 1,
            last_activity_at: new Date('2025-01-27T16:00:00Z'),
            completed_at: new Date('2025-01-28T16:00:00Z'),
        },
    ];

    for (const conversationData of conversations) {
        const existingConversation = await conversationRepository.findOne({
            where: { session_id: conversationData.session_id },
        });

        if (!existingConversation) {
            const conversation = conversationRepository.create(conversationData);
            await conversationRepository.save(conversation);
            console.log(`Created conversation: ${conversation.session_id}`);
        }
    }

    console.log('Conversation sample data seeding completed');
}