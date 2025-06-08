// File name: src/services/whatsapp.service.ts

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Import the Twilio SDK
import twilio from 'twilio';
// Import other services
import { ConversationsService } from '../modules/conversations/conversations.service';
import { UsersService } from '../modules/users/users.service';
import { PropertiesService } from '../modules/properties/properties.service';
import { PropertySearchesService } from '../modules/property-searches/property-searches.service';
import { AIProcessingService } from './ai-processing.service';
import { MessageType, MessageDirection } from '../modules/conversations/entities/conversation.entity';
import { normalizePhoneNumber } from '../common/utils/phone.util';

export interface TwilioWebhookPayload {
    MessageSid: string;
    AccountSid: string;
    From: string; // whatsapp:+2348123456789
    To: string;   // whatsapp:+2349113738527
    Body: string;
    MediaUrl0?: string;
    MediaContentType0?: string;
    NumMedia: string;
    Timestamp: string;
    ApiVersion: string;
    SmsSid: string;
    SmsStatus: string;
    SmsMessageSid: string;
    NumSegments: string;
    ReferralNumMedia?: string;
    MessageType?: string;
    WaId: string; // WhatsApp ID
}

export interface WhatsAppMessage {
    to: string;
    body: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'audio';
}

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);
    private readonly twilioClient: twilio.Twilio;
    private readonly twilioWhatsAppNumber: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly conversationsService: ConversationsService,
        private readonly usersService: UsersService,
        private readonly propertiesService: PropertiesService,
        private readonly propertySearchesService: PropertySearchesService,
        private readonly aiProcessingService: AIProcessingService,
    ) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.twilioWhatsAppNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';

        if (!accountSid || !authToken) {
            this.logger.error('Twilio credentials not configured properly');
            throw new Error('Twilio credentials missing');
        }

        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('WhatsApp Service initialized successfully');
    }

    // Main webhook handler for incoming WhatsApp messages

    async handleIncomingMessage(payload: TwilioWebhookPayload): Promise<void> {
        try {
            this.logger.log(`📱 INCOMING WHATSAPP: ${payload.From} -> "${payload.Body}"`);

            const userPhone = this.extractPhoneNumber(payload.From);
            if (!userPhone) {
                this.logger.error(`❌ Invalid phone format: ${payload.From}`);
                return;
            }

            this.logger.log(`📞 Extracted phone: ${userPhone}`);

            // Get or create conversation
            const { conversation, isNewConversation } = await this.conversationsService.processWhatsAppMessage(
                userPhone,
                payload.Body,
                this.determineMessageType(payload),
                this.extractMessageMetadata(payload)
            );

            this.logger.log(`💬 Conversation ${isNewConversation ? 'created' : 'found'}: ${conversation.id}`);

            // Process with AI - THIS IS THE KEY PART
            this.logger.log(`🤖 Sending to AI: "${payload.Body}"`);

            const aiResponse = await this.aiProcessingService.processMessage(
                payload.Body,
                conversation.context,
                userPhone,
                isNewConversation
            );

            this.logger.log(`✅ AI Response received: "${aiResponse.response.substring(0, 100)}..." (Intent: ${aiResponse.intent})`);

            // Save AI response to conversation
            await this.conversationsService.addAIResponse(
                conversation.id,
                aiResponse.response,
                MessageType.TEXT,
                aiResponse.metadata
            );

            // Send response back to WhatsApp
            this.logger.log(`📤 Sending to WhatsApp: "${aiResponse.response.substring(0, 100)}..."`);

            await this.sendMessage({
                to: userPhone,
                body: aiResponse.response,
            });

            this.logger.log(`✅ WhatsApp message sent successfully to ${userPhone}`);

            // Handle follow-up actions
            await this.handleFollowUpActions(aiResponse, conversation.id, userPhone);

        } catch (error) {
            this.logger.error(`❌ WhatsApp processing failed: ${error.message}`, error.stack);

            // Send fallback response
            const userPhone = this.extractPhoneNumber(payload.From);
            if (userPhone) {
                await this.sendMessage({
                    to: userPhone,
                    body: "I'm sorry, I encountered an issue processing your message. Please try again or say 'help' for assistance.",
                });
            }
        }
    }

    // Send WhatsApp message to user
    async sendMessage(message: WhatsAppMessage): Promise<void> {
        try {
            const twilioMessage = await this.twilioClient.messages.create({
                from: this.twilioWhatsAppNumber,
                to: `whatsapp:${message.to}`,
                body: message.body,
                ...(message.mediaUrl && { mediaUrl: [message.mediaUrl] }),
            });

            this.logger.log(`Message sent successfully to ${message.to}: ${twilioMessage.sid}`);
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${message.to}: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Send property recommendations as WhatsApp message
    async sendPropertyRecommendations(userPhone: string, properties: any[]): Promise<void> {
        if (properties.length === 0) {
            await this.sendMessage({
                to: userPhone,
                body: "Sorry, I couldn't find any properties matching your criteria. Try adjusting your budget or location preferences.",
            });
            return;
        }

        let message = `🏠 *Found ${properties.length} properties for you:*\n\n`;

        properties.slice(0, 5).forEach((property, index) => {
            message += `*${index + 1}. ${property.title}*\n`;
            message += `💰 ${property.formatted_price}/month\n`;
            message += `🏠 ${property.bedrooms}BR/${property.bathrooms}BA\n`;
            message += `📍 ${property.location_display}\n`;
            message += `⭐ Rating: ${property.agent?.rating || 'New'}\n\n`;
        });

        message += `Would you like to see more details about any of these properties? Just reply with the number (1-${Math.min(properties.length, 5)}).`;

        await this.sendMessage({
            to: userPhone,
            body: message,
        });
    }

    // Send agent contact information
    async sendAgentContact(userPhone: string, agent: any, property?: any): Promise<void> {
        let message = `👨‍💼 *Agent Contact Information:*\n\n`;
        message += `*Name:* ${agent.name}\n`;
        message += `*Business:* ${agent.business_name || 'Real Estate Agent'}\n`;
        message += `*Phone:* ${agent.display_phone}\n`;
        message += `*Rating:* ${'⭐'.repeat(Math.floor(agent.rating))} (${agent.rating}/5.0)\n`;
        message += `*Location:* ${agent.location}\n\n`;

        if (property) {
            message += `*Regarding Property:* ${property.title}\n`;
            message += `*Address:* ${property.location_display}\n\n`;
        }

        message += `You can contact this agent directly at ${agent.display_phone} or I can help you with more properties.`;

        await this.sendMessage({
            to: userPhone,
            body: message,
        });
    }

    // Send welcome message to new users
    async sendWelcomeMessage(userPhone: string): Promise<void> {
        const message = `🏠 *Welcome to SettleSmart AI!*

                        I'm your intelligent property assistant for finding rental homes in Nigeria. 

                        *Here's how I can help you:*
                        🔍 Find properties matching your budget
                        📍 Search by location (Lugbe, Kuje, Gwagwalada)
                        🏠 Filter by bedrooms, amenities, and more
                        👨‍💼 Connect you with verified agents

                        *To get started, try saying:*
                        • "I need a 2-bedroom flat in Lugbe under ₦800k"
                        • "Show me houses with parking in Kuje"
                        • "What's available for ₦500k?"

                        What type of property are you looking for? 🤔`;

        await this.sendMessage({
            to: userPhone,
            body: message,
        });
    }

    // Send help message
    async sendHelpMessage(userPhone: string): Promise<void> {
        const message = `ℹ️ *SettleSmart AI Help*

                        *Commands you can use:*
                        • "Search" or "Find" - Look for properties
                        • "Budget ₦X to ₦Y" - Set your budget range
                        • "Location [area]" - Set preferred location
                        • "Bedrooms [number]" - Specify bedroom count
                        • "Help" - Show this help message
                        • "Contact agent" - Get agent information

                        *Example searches:*
                        • "2-bedroom flat in Lugbe under ₦700k"
                        • "House with parking in Kuje"
                        • "Self-contain apartment for ₦300k"

                        *My features:*
                        🤖 AI-powered property matching
                        ✅ Verified agents and listings
                        📱 WhatsApp-native experience
                        🏠 Real-time property updates

                        Need assistance? Just describe what you're looking for! 🏠`;

        await this.sendMessage({
            to: userPhone,
            body: message,
        });
    }

    // Send location suggestions
    async sendLocationSuggestions(userPhone: string): Promise<void> {
        const message = `📍 *Popular Areas in Abuja:*

                        *Lugbe:*
                        • Lugbe Phase 1 - Established area
                        • Lugbe Phase 2 - Modern developments  
                        • Lugbe Extension - Affordable options

                        *Other Areas:*
                        • Kuje - Budget-friendly
                        • Gwagwalada - Spacious properties
                        • Kubwa - Family-friendly

                        *Price Ranges by Area:*
                        • Lugbe: ₦400k - ₦1.2M
                        • Kuje: ₦200k - ₦600k
                        • Gwagwalada: ₦300k - ₦800k

                        Which area interests you? I can show you available properties there! 🏠`;

        await this.sendMessage({
            to: userPhone,
            body: message,
        });
    }

    // Send budget guidance
    async sendBudgetGuidance(userPhone: string): Promise<void> {
        const message = `💰 *Budget Planning Guide:*

                        *Typical Monthly Rent in Abuja:*

                        *1-Bedroom/Self-Contain:*
                        • Lugbe: ₦200k - ₦500k
                        • Kuje: ₦150k - ₦350k

                        *2-Bedroom Flats:*
                        • Lugbe: ₦400k - ₦800k
                        • Kuje: ₦250k - ₦500k

                        *3-Bedroom Houses:*
                        • Lugbe: ₦600k - ₦1.2M
                        • Kuje: ₦400k - ₦700k

                        *Additional Costs to Consider:*
                        • Agent fee: 10% of annual rent
                        • Caution deposit: 1-2 months rent
                        • Service charge: ₦20k-50k/month

                        Tell me your budget range and I'll find perfect matches! 💫`;

        await this.sendMessage({
            to: userPhone,
            body: message,
        });
    }

    // Private helper methods

    private extractPhoneNumber(whatsappNumber: string): string | null {
        // Extract phone number from "whatsapp:+2348123456789" format
        const match = whatsappNumber.match(/whatsapp:(\+\d+)/);
        if (match && match[1]) {
            return normalizePhoneNumber(match[1]);
        }
        return null;
    }

    private determineMessageType(payload: TwilioWebhookPayload): MessageType {
        const numMedia = parseInt(payload.NumMedia || '0', 10);

        if (numMedia > 0 && payload.MediaContentType0) {
            if (payload.MediaContentType0.startsWith('image/')) {
                return MessageType.IMAGE;
            }
            if (payload.MediaContentType0.startsWith('audio/')) {
                return MessageType.VOICE;
            }
        }

        return MessageType.TEXT;
    }

    private extractMessageMetadata(payload: TwilioWebhookPayload): any {
        return {
            messageSid: payload.MessageSid,
            timestamp: payload.Timestamp,
            numMedia: payload.NumMedia,
            mediaUrl: payload.MediaUrl0,
            mediaType: payload.MediaContentType0,
            waId: payload.WaId,
            twilioAccountSid: payload.AccountSid,
        };
    }

    private async handleFollowUpActions(
        aiResponse: any,
        conversationId: string,
        userPhone: string
    ): Promise<void> {
        try {
            // Handle property search requests
            if (aiResponse.action === 'search_properties' && aiResponse.searchCriteria) {
                await this.handlePropertySearch(aiResponse.searchCriteria, conversationId, userPhone);
            }

            // Handle agent contact requests
            if (aiResponse.action === 'contact_agent' && aiResponse.agentId) {
                await this.handleAgentContact(aiResponse.agentId, userPhone);
            }

            // Handle budget setting
            if (aiResponse.action === 'set_budget' && aiResponse.budget) {
                await this.handleBudgetSetting(aiResponse.budget, userPhone);
            }

            // Handle location preference update
            if (aiResponse.action === 'set_location' && aiResponse.location) {
                await this.handleLocationSetting(aiResponse.location, userPhone);
            }

            // Handle help requests
            if (aiResponse.action === 'show_help') {
                await this.sendHelpMessage(userPhone);
            }

            // Handle location suggestions
            if (aiResponse.action === 'show_locations') {
                await this.sendLocationSuggestions(userPhone);
            }

            // Handle budget guidance
            if (aiResponse.action === 'show_budget_guide') {
                await this.sendBudgetGuidance(userPhone);
            }

        } catch (error) {
            this.logger.error(`Error handling follow-up actions: ${error.message}`, error.stack);
        }
    }

    private async handlePropertySearch(
        searchCriteria: any,
        conversationId: string,
        userPhone: string
    ): Promise<void> {
        try {
            // Search for properties
            const properties = await this.propertiesService.searchProperties({
                ...searchCriteria,
                page: 1,
                limit: 10,
            });

            // Record the search
            await this.propertySearchesService.createSearchFromConversation(
                userPhone,
                conversationId,
                `Property search: ${JSON.stringify(searchCriteria)}`,
                searchCriteria,
                {
                    total_found: properties.data.length,
                    properties_returned: Math.min(properties.data.length, 5),
                    average_score: 75, // This would be calculated from actual matching
                }
            );

            // Send property recommendations
            await this.sendPropertyRecommendations(userPhone, properties.data);

            // Update conversation context
            await this.conversationsService.recordPropertyRecommendations(
                conversationId,
                properties.data.map(p => p.id)
            );

        } catch (error) {
            this.logger.error(`Error handling property search: ${error.message}`, error.stack);
            await this.sendMessage({
                to: userPhone,
                body: 'Sorry, I encountered an issue searching for properties. Please try again.',
            });
        }
    }

    private async handleAgentContact(agentId: string, userPhone: string): Promise<void> {
        try {
            // This would normally fetch agent details
            // For now, we'll send a generic message
            await this.sendMessage({
                to: userPhone,
                body: 'I\'ll help you connect with a verified agent. Let me fetch their contact information...',
            });

            // TODO: Implement actual agent fetching and contact sharing

        } catch (error) {
            this.logger.error(`Error handling agent contact: ${error.message}`, error.stack);
        }
    }

    private async handleBudgetSetting(budget: any, userPhone: string): Promise<void> {
        try {
            // Find or create user
            const user = await this.usersService.findOrCreateUser(userPhone);

            // Update user budget
            await this.usersService.setBudgetRange(user.id, {
                min_budget: budget.min,
                max_budget: budget.max,
            });

            await this.sendMessage({
                to: userPhone,
                body: `✅ Budget updated! I'll look for properties between ₦${budget.min.toLocaleString()} and ₦${budget.max.toLocaleString()} per month.`,
            });

        } catch (error) {
            this.logger.error(`Error setting budget: ${error.message}`, error.stack);
        }
    }

    private async handleLocationSetting(location: string, userPhone: string): Promise<void> {
        try {
            // Find or create user
            const user = await this.usersService.findOrCreateUser(userPhone);

            // Update user location preference
            await this.usersService.updateUser(user.id, {
                location_preference: location,
            });

            await this.sendMessage({
                to: userPhone,
                body: `📍 Location preference updated to ${location}. I'll prioritize properties in this area.`,
            });

        } catch (error) {
            this.logger.error(`Error setting location: ${error.message}`, error.stack);
        }
    }

    // Webhook validation for security
    validateWebhook(signature: string, url: string, params: any): boolean {
        try {
            const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
            if (!authToken) return false;

            return twilio.validateRequest(authToken, signature, url, params);
        } catch (error) {
            this.logger.error(`Webhook validation failed: ${error.message}`);
            return false;
        }
    }

    // Send template messages (for marketing/notifications)
    async sendTemplateMessage(
        userPhone: string,
        templateName: string,
        parameters: Record<string, string>
    ): Promise<void> {
        try {
            // This would use WhatsApp Business API templates
            // For now, we'll send a formatted message
            let message = '';

            switch (templateName) {
                case 'property_alert':
                    message = `🏠 *New Property Alert!*\n\nA ${parameters.bedrooms}-bedroom ${parameters.type} in ${parameters.location} for ₦${parameters.price}/month just became available!\n\nInterested? Reply "YES" to see details.`;
                    break;
                case 'viewing_reminder':
                    message = `⏰ *Viewing Reminder*\n\nYour property viewing is scheduled for ${parameters.date} at ${parameters.time}.\n\nLocation: ${parameters.address}\nAgent: ${parameters.agent_name}\n\nSee you there!`;
                    break;
                default:
                    throw new Error(`Unknown template: ${templateName}`);
            }

            await this.sendMessage({
                to: userPhone,
                body: message,
            });

        } catch (error) {
            this.logger.error(`Error sending template message: ${error.message}`, error.stack);
        }
    }

    // Broadcast message to multiple users
    async broadcastMessage(userPhones: string[], message: string): Promise<{
        sent: number;
        failed: string[];
    }> {
        const failed: string[] = [];
        let sent = 0;

        for (const userPhone of userPhones) {
            try {
                await this.sendMessage({
                    to: userPhone,
                    body: message,
                });
                sent++;

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                this.logger.error(`Failed to send broadcast message to ${userPhone}: ${error.message}`);
                failed.push(userPhone);
            }
        }

        return { sent, failed };
    }

    // Send media message (images, documents)
    async sendMediaMessage(
        userPhone: string,
        mediaUrl: string,
        mediaType: 'image' | 'document' | 'audio',
        caption?: string
    ): Promise<void> {
        try {
            await this.twilioClient.messages.create({
                from: this.twilioWhatsAppNumber,
                to: `whatsapp:${userPhone}`,
                mediaUrl: [mediaUrl],
                body: caption || '',
            });

            this.logger.log(`Media message sent to ${userPhone}: ${mediaUrl}`);
        } catch (error) {
            this.logger.error(`Failed to send media message to ${userPhone}: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Send interactive message with buttons
    async sendInteractiveMessage(
        userPhone: string,
        bodyText: string,
        buttons: Array<{ id: string; title: string }>
    ): Promise<void> {
        try {
            // WhatsApp Business API supports interactive messages
            // For Twilio sandbox, we'll simulate with numbered options
            let message = bodyText + '\n\n';
            buttons.forEach((button, index) => {
                message += `${index + 1}. ${button.title}\n`;
            });
            message += '\nReply with the number of your choice.';

            await this.sendMessage({
                to: userPhone,
                body: message,
            });

        } catch (error) {
            this.logger.error(`Error sending interactive message: ${error.message}`, error.stack);
        }
    }

    // Handle voice message transcription
    async handleVoiceMessage(mediaUrl: string, userPhone: string): Promise<string> {
        try {
            // This would integrate with speech-to-text service
            // For now, let's just return a placeholder
            this.logger.log(`Processing voice message from ${userPhone}: ${mediaUrl}`);

            // TODO: Integrate with Google Speech-to-Text or similar
            return 'Voice message received. Please type your message for better accuracy.';

        } catch (error) {
            this.logger.error(`Error processing voice message: ${error.message}`, error.stack);
            return 'Sorry, I couldn\'t process your voice message. Please try typing your message.';
        }
    }

    // Get message status
    async getMessageStatus(messageSid: string): Promise<any> {
        try {
            const message = await this.twilioClient.messages(messageSid).fetch();
            return {
                sid: message.sid,
                status: message.status,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage,
                dateCreated: message.dateCreated,
                dateSent: message.dateSent,
                dateUpdated: message.dateUpdated,
            };
        } catch (error) {
            this.logger.error(`Error fetching message status: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Analytics and reporting
    async getWhatsAppAnalytics(days: number = 7): Promise<{
        total_messages_sent: number;
        total_messages_received: number;
        unique_users: number;
        message_success_rate: number;
        popular_intents: Record<string, number>;
        response_times: {
            average_seconds: number;
            median_seconds: number;
        };
    }> {
        try {
            // This would normally query Twilio API and our database
            // For now, return mock analytics
            return {
                total_messages_sent: 245,
                total_messages_received: 189,
                unique_users: 67,
                message_success_rate: 98.5,
                popular_intents: {
                    'property_search': 89,
                    'budget_inquiry': 34,
                    'location_question': 28,
                    'agent_contact': 15,
                },
                response_times: {
                    average_seconds: 2.3,
                    median_seconds: 1.8,
                },
            };
        } catch (error) {
            this.logger.error(`Error getting WhatsApp analytics: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Health check for WhatsApp service
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'down';
        twilio_connected: boolean;
        last_message_sent: Date | null;
        error?: string;
    }> {
        try {
            // Test Twilio connection
            await this.twilioClient.api.accounts.list({ limit: 1 });

            return {
                status: 'healthy',
                twilio_connected: true,
                last_message_sent: new Date(), // This would be tracked in database
            };
        } catch (error) {
            this.logger.error(`WhatsApp service health check failed: ${error.message}`);
            return {
                status: 'down',
                twilio_connected: false,
                last_message_sent: null,
                error: error.message,
            };
        }
    }
}