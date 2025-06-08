// File name: src/modules/whatsapp/whatsapp.controller.ts

import {
    Controller,
    Post,
    Get,
    Body,
    Headers,
    HttpStatus,
    BadRequestException,
    UseGuards,
    Query,
    Param,
    Logger,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiParam,
    ApiQuery,
    ApiHeader,
} from '@nestjs/swagger';
import { WhatsAppService, TwilioWebhookPayload } from '../../services/whatsapp.service';
import { AIProcessingService } from '../../services/ai-processing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('WhatsApp Integration')
@Controller('whatsapp')
export class WhatsAppController {
    private readonly logger = new Logger(WhatsAppController.name);

    constructor(
        private readonly whatsAppService: WhatsAppService,
        private readonly aiProcessingService: AIProcessingService,
    ) { }

    @Post('incoming')
    @ApiOperation({
        summary: 'WhatsApp Webhook Handler',
        description: 'Handle incoming WhatsApp messages from Twilio webhook. This is the main entry point for all user interactions via WhatsApp.'
    })
    @ApiHeader({
        name: 'x-twilio-signature',
        description: 'Twilio webhook signature for security validation',
        required: false,
    })
    @ApiBody({
        description: 'Twilio WhatsApp webhook payload',
        schema: {
            type: 'object',
            properties: {
                MessageSid: {
                    type: 'string',
                    example: 'SM1234567890abcdef1234567890abcdef',
                    description: 'Unique identifier for the message'
                },
                AccountSid: {
                    type: 'string',
                    example: 'AC1234567890abcdef1234567890abcdef',
                    description: 'Twilio Account SID'
                },
                From: {
                    type: 'string',
                    example: 'whatsapp:+2348123456789',
                    description: 'Sender WhatsApp number'
                },
                To: {
                    type: 'string',
                    example: 'whatsapp:+14155238886',
                    description: 'Recipient WhatsApp number (your Twilio number)'
                },
                Body: {
                    type: 'string',
                    example: 'I need a 2-bedroom flat in Lugbe under 800k',
                    description: 'Message content from user'
                },
                MediaUrl0: {
                    type: 'string',
                    example: 'https://api.twilio.com/media/123.jpg',
                    description: 'URL of first media attachment (if any)'
                },
                MediaContentType0: {
                    type: 'string',
                    example: 'image/jpeg',
                    description: 'Content type of first media attachment'
                },
                NumMedia: {
                    type: 'string',
                    example: '0',
                    description: 'Number of media attachments'
                },
                Timestamp: {
                    type: 'string',
                    example: '2025-06-01T10:30:00Z',
                    description: 'Message timestamp'
                },
                WaId: {
                    type: 'string',
                    example: '2348123456789',
                    description: 'WhatsApp ID (phone number without +)'
                },
                ApiVersion: { type: 'string', example: '2010-04-01' },
                SmsSid: { type: 'string', example: 'SM1234567890abcdef1234567890abcdef' },
                SmsStatus: { type: 'string', example: 'received' },
                SmsMessageSid: { type: 'string', example: 'SM1234567890abcdef1234567890abcdef' },
                NumSegments: { type: 'string', example: '1' },
            },
            required: ['MessageSid', 'AccountSid', 'From', 'To', 'Body', 'NumMedia', 'Timestamp', 'WaId']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Message processed successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Message processed successfully' },
                data: {
                    type: 'object',
                    properties: {
                        messageSid: { type: 'string' },
                        userPhone: { type: 'string' },
                        processedAt: { type: 'string' }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid webhook payload or signature',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Invalid webhook signature' },
                error: { type: 'string' }
            }
        }
    })
    async handleIncomingMessage(
        @Body() payload: TwilioWebhookPayload,
        @Headers('x-twilio-signature') twilioSignature?: string,
    ) {
        try {
            this.logger.log(`Incoming WhatsApp message: ${payload.MessageSid} from ${payload.From}`);

            // Validate webhook signature for security (optional but recommended)
            if (twilioSignature) {
                // TODO: I need to replace with actual webhook URL
                const webhookUrl = process.env.WEBHOOK_URL || 'https://settlesmartaihub.onrender.com/api/v1/whatsapp/incoming';
                const isValid = this.whatsAppService.validateWebhook(
                    twilioSignature,
                    webhookUrl,
                    payload
                );

                if (!isValid) {
                    this.logger.warn(`Invalid webhook signature for message ${payload.MessageSid}`);
                    throw new BadRequestException('Invalid webhook signature');
                }
            }

            // Process the incoming message
            await this.whatsAppService.handleIncomingMessage(payload);

            return {
                success: true,
                message: 'Message processed successfully',
                data: {
                    messageSid: payload.MessageSid,
                    userPhone: payload.From,
                    processedAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Error processing WhatsApp webhook: ${error.message}`, error.stack);

            // Return success to Twilio to avoid retries for unrecoverable errors
            // Log the error internally but don't expose details to external webhook
            return {
                success: false,
                message: 'Message processing failed',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal processing error',
            };
        }
    }

    @Post('send')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Send WhatsApp Message',
        description: 'Send a WhatsApp message to a user manually (Admin/Agent only)'
    })
    @ApiBody({
        description: 'Message details',
        schema: {
            type: 'object',
            properties: {
                to: {
                    type: 'string',
                    example: '+2348123456789',
                    description: 'Recipient phone number in international format'
                },
                body: {
                    type: 'string',
                    example: 'Hello! Here are some properties that match your criteria...',
                    description: 'Message content to send'
                },
                mediaUrl: {
                    type: 'string',
                    example: 'https://example.com/property-image.jpg',
                    description: 'Optional media URL to attach'
                },
                mediaType: {
                    type: 'string',
                    enum: ['image', 'document', 'audio'],
                    example: 'image',
                    description: 'Type of media being sent'
                }
            },
            required: ['to', 'body']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Message sent successfully',
        schema: {
            example: {
                success: true,
                message: 'WhatsApp message sent successfully',
                data: {
                    to: '+2348123456789',
                    sentAt: '2025-06-01T10:30:00Z'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid phone number or message content'
    })
    async sendMessage(@Body() body: {
        to: string;
        body: string;
        mediaUrl?: string;
        mediaType?: 'image' | 'document' | 'audio';
    }) {
        try {
            await this.whatsAppService.sendMessage({
                to: body.to,
                body: body.body,
                mediaUrl: body.mediaUrl,
                mediaType: body.mediaType,
            });

            return {
                success: true,
                message: 'WhatsApp message sent successfully',
                data: {
                    to: body.to,
                    sentAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${body.to}: ${error.message}`);
            return {
                success: false,
                message: 'Failed to send WhatsApp message',
                error: error.message,
            };
        }
    }

    @Post('send-properties')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Send Property Recommendations',
        description: 'Send formatted property recommendations to a user via WhatsApp'
    })
    @ApiBody({
        description: 'Property recommendations data',
        schema: {
            type: 'object',
            properties: {
                userPhone: {
                    type: 'string',
                    example: '+2348123456789',
                    description: 'User phone number to send recommendations to'
                },
                properties: {
                    type: 'array',
                    description: 'Array of property objects to recommend',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'prop-123' },
                            title: { type: 'string', example: '2-Bedroom Flat in Lugbe Phase 1' },
                            price: { type: 'number', example: 750000 },
                            formatted_price: { type: 'string', example: '₦750,000' },
                            bedrooms: { type: 'number', example: 2 },
                            bathrooms: { type: 'number', example: 2 },
                            location_display: { type: 'string', example: 'Lugbe Phase 1, Near Market' },
                            agent: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'John Properties' },
                                    rating: { type: 'number', example: 4.5 }
                                }
                            }
                        }
                    }
                }
            },
            required: ['userPhone', 'properties']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Property recommendations sent successfully',
        schema: {
            example: {
                success: true,
                message: 'Property recommendations sent successfully',
                data: {
                    userPhone: '+2348123456789',
                    propertiesCount: 5,
                    sentAt: '2025-06-01T10:30:00Z'
                }
            }
        }
    })
    async sendPropertyRecommendations(@Body() body: {
        userPhone: string;
        properties: any[];
    }) {
        try {
            await this.whatsAppService.sendPropertyRecommendations(body.userPhone, body.properties);

            return {
                success: true,
                message: 'Property recommendations sent successfully',
                data: {
                    userPhone: body.userPhone,
                    propertiesCount: body.properties.length,
                    sentAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Failed to send property recommendations to ${body.userPhone}: ${error.message}`);
            return {
                success: false,
                message: 'Failed to send property recommendations',
                error: error.message,
            };
        }
    }

    @Get('health')
    @ApiOperation({
        summary: 'WhatsApp Service Health Check',
        description: 'Check the health status of WhatsApp integration and Twilio connectivity'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Health check completed',
        schema: {
            example: {
                success: true,
                message: 'WhatsApp service health check completed',
                data: {
                    status: 'healthy',
                    twilio_connected: true,
                    last_message_sent: '2025-06-01T10:30:00Z',
                    webhook_configured: true,
                    api_version: '2010-04-01'
                }
            }
        }
    })
    async healthCheck() {
        try {
            const health = await this.whatsAppService.healthCheck();
            return {
                success: true,
                message: 'WhatsApp service health check completed',
                data: health,
            };
        } catch (error) {
            this.logger.error(`WhatsApp health check failed: ${error.message}`);
            return {
                success: false,
                message: 'Health check failed',
                data: {
                    status: 'down',
                    error: error.message,
                    checked_at: new Date().toISOString(),
                },
            };
        }
    }

    @Post('send-agent-contact')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Send Agent Contact Information',
        description: 'Send agent contact details to a user via WhatsApp'
    })
    @ApiBody({
        description: 'Agent contact information',
        schema: {
            type: 'object',
            properties: {
                userPhone: {
                    type: 'string',
                    example: '+2348123456789',
                    description: 'User phone number to send agent contact to'
                },
                agent: {
                    type: 'object',
                    description: 'Agent information to share',
                    properties: {
                        name: { type: 'string', example: 'John Doe' },
                        business_name: { type: 'string', example: 'John Properties Ltd' },
                        phone_number: { type: 'string', example: '+2348123456790' },
                        display_phone: { type: 'string', example: '+234 812 345 6790' },
                        rating: { type: 'number', example: 4.5 },
                        location: { type: 'string', example: 'Lugbe, Abuja' }
                    },
                    required: ['name', 'phone_number', 'rating']
                },
                property: {
                    type: 'object',
                    description: 'Optional property context',
                    properties: {
                        title: { type: 'string', example: '2-Bedroom Flat in Lugbe' },
                        location_display: { type: 'string', example: 'Lugbe Phase 1, Near Market' }
                    }
                }
            },
            required: ['userPhone', 'agent']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent contact sent successfully',
        schema: {
            example: {
                success: true,
                message: 'Agent contact sent successfully',
                data: {
                    userPhone: '+2348123456789',
                    agentName: 'John Doe',
                    sentAt: '2025-06-01T10:30:00Z'
                }
            }
        }
    })
    async sendAgentContact(@Body() body: {
        userPhone: string;
        agent: any;
        property?: any;
    }) {
        try {
            await this.whatsAppService.sendAgentContact(body.userPhone, body.agent, body.property);
            return {
                success: true,
                message: 'Agent contact sent successfully',
                data: {
                    userPhone: body.userPhone,
                    agentName: body.agent.name,
                    sentAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Failed to send agent contact to ${body.userPhone}: ${error.message}`);
            return {
                success: false,
                message: 'Failed to send agent contact',
                error: error.message,
            };
        }
    }

    @Post('broadcast')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Broadcast Message',
        description: 'Send the same message to multiple users (Admin only)'
    })
    @ApiBody({
        description: 'Broadcast message details',
        schema: {
            type: 'object',
            properties: {
                userPhones: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['+2348123456789', '+2348123456790', '+2348123456791'],
                    description: 'Array of user phone numbers to send message to'
                },
                message: {
                    type: 'string',
                    example: 'New properties available in your area! Check out our latest listings.',
                    description: 'Message content to broadcast'
                },
                delayMs: {
                    type: 'number',
                    example: 1000,
                    description: 'Delay between messages in milliseconds (default: 1000)'
                }
            },
            required: ['userPhones', 'message']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Broadcast completed',
        schema: {
            example: {
                success: true,
                message: 'Broadcast completed successfully',
                data: {
                    sent: 15,
                    failed: ['+2348123456789'],
                    totalUsers: 16,
                    startedAt: '2025-06-01T10:30:00Z',
                    completedAt: '2025-06-01T10:31:15Z'
                }
            }
        }
    })
    async broadcastMessage(@Body() body: {
        userPhones: string[];
        message: string;
        delayMs?: number;
    }) {
        try {
            const startTime = new Date();
            const result = await this.whatsAppService.broadcastMessage(body.userPhones, body.message);
            return {
                success: true,
                message: 'Broadcast completed successfully',
                data: {
                    sent: result.sent,
                    failed: result.failed,
                    totalUsers: body.userPhones.length,
                    startedAt: startTime.toISOString(),
                    completedAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Broadcast failed: ${error.message}`);
            return {
                success: false,
                message: 'Broadcast failed',
                error: error.message,
            };
        }
    }

    @Post('template')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Send Template Message',
        description: 'Send a predefined template message (property alert, viewing reminder, etc.)'
    })
    @ApiBody({
        description: 'Template message configuration',
        schema: {
            type: 'object',
            properties: {
                userPhone: {
                    type: 'string',
                    example: '+2348123456789',
                    description: 'User phone number to send template to'
                },
                templateName: {
                    type: 'string',
                    enum: ['property_alert', 'viewing_reminder', 'welcome', 'follow_up'],
                    example: 'property_alert',
                    description: 'Name of the template to use'
                },
                parameters: {
                    type: 'object',
                    description: 'Template parameters to fill in placeholders',
                    example: {
                        bedrooms: '2',
                        type: 'flat',
                        location: 'Lugbe',
                        price: '750,000',
                        agent_name: 'John Doe',
                        date: 'Tomorrow',
                        time: '2:00 PM',
                        address: 'Plot 123, Lugbe Phase 1'
                    }
                }
            },
            required: ['userPhone', 'templateName', 'parameters']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Template message sent successfully',
        schema: {
            example: {
                success: true,
                message: 'Template message sent successfully',
                data: {
                    userPhone: '+2348123456789',
                    template: 'property_alert',
                    sentAt: '2025-06-01T10:30:00Z'
                }
            }
        }
    })
    async sendTemplateMessage(@Body() body: {
        userPhone: string;
        templateName: string;
        parameters: Record<string, string>;
    }) {
        try {
            await this.whatsAppService.sendTemplateMessage(
                body.userPhone,
                body.templateName,
                body.parameters
            );
            return {
                success: true,
                message: 'Template message sent successfully',
                data: {
                    userPhone: body.userPhone,
                    template: body.templateName,
                    sentAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Failed to send template message to ${body.userPhone}: ${error.message}`);
            return {
                success: false,
                message: 'Failed to send template message',
                error: error.message,
            };
        }
    }

    @Post('interactive')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Send Interactive Message',
        description: 'Send an interactive message with buttons/options'
    })
    @ApiBody({
        description: 'Interactive message configuration',
        schema: {
            type: 'object',
            properties: {
                userPhone: {
                    type: 'string',
                    example: '+2348123456789',
                    description: 'User phone number to send interactive message to'
                },
                bodyText: {
                    type: 'string',
                    example: 'Which of these properties interests you most?',
                    description: 'Main message text'
                },
                buttons: {
                    type: 'array',
                    description: 'Array of button options',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'prop1' },
                            title: { type: 'string', example: '2BR Flat in Lugbe - ₦750k' }
                        },
                        required: ['id', 'title']
                    },
                    example: [
                        { id: 'prop1', title: '2BR Flat in Lugbe - ₦750k' },
                        { id: 'prop2', title: '3BR House in Kuje - ₦600k' },
                        { id: 'more', title: 'Show me more options' }
                    ]
                }
            },
            required: ['userPhone', 'bodyText', 'buttons']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Interactive message sent successfully',
        schema: {
            example: {
                success: true,
                message: 'Interactive message sent successfully',
                data: {
                    userPhone: '+2348123456789',
                    buttonCount: 3,
                    sentAt: '2025-06-01T10:30:00Z'
                }
            }
        }
    })
    async sendInteractiveMessage(@Body() body: {
        userPhone: string;
        bodyText: string;
        buttons: Array<{ id: string; title: string }>;
    }) {
        try {
            await this.whatsAppService.sendInteractiveMessage(
                body.userPhone,
                body.bodyText,
                body.buttons
            );
            return {
                success: true,
                message: 'Interactive message sent successfully',
                data: {
                    userPhone: body.userPhone,
                    buttonCount: body.buttons.length,
                    sentAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Failed to send interactive message to ${body.userPhone}: ${error.message}`);
            return {
                success: false,
                message: 'Failed to send interactive message',
                error: error.message,
            };
        }
    }

    @Post('media')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Send Media Message',
        description: 'Send image, document, or audio message via WhatsApp'
    })
    @ApiBody({
        description: 'Media message details',
        schema: {
            type: 'object',
            properties: {
                userPhone: {
                    type: 'string',
                    example: '+2348123456789',
                    description: 'User phone number to send media to'
                },
                mediaUrl: {
                    type: 'string',
                    example: 'https://example.com/property-image.jpg',
                    description: 'URL of the media file to send'
                },
                mediaType: {
                    type: 'string',
                    enum: ['image', 'document', 'audio'],
                    example: 'image',
                    description: 'Type of media being sent'
                },
                caption: {
                    type: 'string',
                    example: 'Beautiful 2-bedroom flat in Lugbe - ₦750,000/month',
                    description: 'Optional caption for the media'
                }
            },
            required: ['userPhone', 'mediaUrl', 'mediaType']
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Media message sent successfully',
        schema: {
            example: {
                success: true,
                message: 'Media message sent successfully',
                data: {
                    userPhone: '+2348123456789',
                    mediaType: 'image',
                    mediaUrl: 'https://example.com/property-image.jpg',
                    sentAt: '2025-06-01T10:30:00Z'
                }
            }
        }
    })
    async sendMediaMessage(@Body() body: {
        userPhone: string;
        mediaUrl: string;
        mediaType: 'image' | 'document' | 'audio';
        caption?: string;
    }) {
        try {
            await this.whatsAppService.sendMediaMessage(
                body.userPhone,
                body.mediaUrl,
                body.mediaType,
                body.caption
            );
            return {
                success: true,
                message: 'Media message sent successfully',
                data: {
                    userPhone: body.userPhone,
                    mediaType: body.mediaType,
                    mediaUrl: body.mediaUrl,
                    sentAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error(`Failed to send media message to ${body.userPhone}: ${error.message}`);
            return {
                success: false,
                message: 'Failed to send media message',
                error: error.message,
            };
        }
    }

    @Get('analytics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get WhatsApp Analytics',
        description: 'Get WhatsApp messaging analytics and metrics (Admin only)'
    })
    @ApiQuery({
        name: 'days',
        description: 'Number of days to analyze',
        example: 7,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Analytics retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'WhatsApp analytics retrieved successfully',
                data: {
                    total_messages_sent: 245,
                    total_messages_received: 189,
                    unique_users: 67,
                    message_success_rate: 98.5,
                    popular_intents: {
                        'property_search': 89,
                        'budget_inquiry': 34,
                        'location_question': 28,
                        'agent_contact': 15
                    },
                    response_times: {
                        average_seconds: 2.3,
                        median_seconds: 1.8
                    },
                    daily_breakdown: [
                        { date: '2025-06-01', sent: 45, received: 38 },
                        { date: '2025-05-31', sent: 52, received: 41 }
                    ]
                }
            }
        }
    })
    async getAnalytics(@Query('days') days: number = 7) {
        try {
            const analytics = await this.whatsAppService.getWhatsAppAnalytics(days);
            return {
                success: true,
                message: 'WhatsApp analytics retrieved successfully',
                data: analytics,
            };
        } catch (error) {
            this.logger.error(`Failed to retrieve WhatsApp analytics: ${error.message}`);
            return {
                success: false,
                message: 'Failed to retrieve analytics',
                error: error.message,
            };
        }
    }

    @Get('message/:messageSid/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get Message Status',
        description: 'Get delivery status of a specific WhatsApp message using Twilio Message SID'
    })
    @ApiParam({
        name: 'messageSid',
        description: 'Twilio Message SID',
        example: 'SM1234567890abcdef1234567890abcdef'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Message status retrieved successfully',
        schema: {
            example: {
                success: true,
                message: 'Message status retrieved successfully',
                data: {
                    sid: 'SM1234567890abcdef1234567890abcdef',
                    status: 'delivered',
                    errorCode: null,
                    errorMessage: null,
                    dateCreated: '2025-06-01T10:30:00Z',
                    dateSent: '2025-06-01T10:30:01Z',
                    dateUpdated: '2025-06-01T10:30:02Z',
                    direction: 'outbound-api',
                    from: 'whatsapp:+14155238886',
                    to: 'whatsapp:+2348123456789',
                    price: '0.005',
                    priceUnit: 'USD'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Message not found'
    })
    async getMessageStatus(@Param('messageSid') messageSid: string) {
        try {
            const status = await this.whatsAppService.getMessageStatus(messageSid);
            return {
                success: true,
                message: 'Message status retrieved successfully',
                data: status,
            };
        } catch (error) {
            this.logger.error(`Failed to retrieve message status for ${messageSid}: ${error.message}`);
            return {
                success: false,
                message: 'Failed to retrieve message status',
                error: error.message,
            };
        }
    }

    @Get('webhook/verify')
    @ApiOperation({
        summary: 'Webhook Verification',
        description: 'Verify webhook endpoint for WhatsApp Business API (Facebook/Meta verification)'
    })
    @ApiQuery({
        name: 'hub.mode',
        description: 'Verification mode from Facebook',
        example: 'subscribe'
    })
    @ApiQuery({
        name: 'hub.challenge',
        description: 'Verification challenge token from Facebook',
        example: 'challenge_12345'
    })
    @ApiQuery({
        name: 'hub.verify_token',
        description: 'Verification token to validate',
        example: 'settlesmart_verify_token'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Webhook verified successfully',
        schema: {
            type: 'string',
            example: 'challenge_12345'
        }
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid verification token'
    })
    async verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.challenge') challenge: string,
        @Query('hub.verify_token') verifyToken: string,
    ) {
        try {
            // For WhatsApp Business API webhook verification
            const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'settlesmart_verify_token';

            this.logger.log(`Webhook verification attempt: mode=${mode}, token=${verifyToken}`);

            if (mode === 'subscribe' && verifyToken === expectedToken) {
                this.logger.log('Webhook verification successful');
                return challenge;
            } else {
                this.logger.warn('Webhook verification failed: invalid token or mode');
                throw new BadRequestException('Invalid verification token or mode');
            }
        } catch (error) {
            this.logger.error(`Webhook verification error: ${error.message}`);
            throw new BadRequestException('Webhook verification failed');
        }
    }

    @Get('test-ai-flow')
    @ApiOperation({
        summary: 'Test AI Flow',
        description: 'Test the AI flow with a sample message'
    })
    @ApiQuery({
        name: 'message',
        description: 'Sample message to test the AI flow',
        example: 'I need a 2-bedroom flat in Lugbe under 800k'
    })
    async testAIFlow(@Query('message') message: string = 'I need a 2-bedroom flat in Lugbe under 800k') {
        try {
            this.logger.log(`🧪 Testing AI flow with message: "${message}"`);

            const mockContext = {
                current_intent: null,
                conversation_stage: 'initial',
                search_criteria: {},
                last_property_recommendations: [],
                matched_agents: []
            };

            const aiResponse = await this.aiProcessingService.processMessage(
                message,
                mockContext,
                '+2348123456789',
                true
            );

            this.logger.log(`✅ AI Test Result: "${aiResponse.response}"`);

            return {
                success: true,
                test_message: message,
                ai_response: aiResponse,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error(`❌ AI Test Failed: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
        }
    }

    @Get('test-openai-public')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Test OpenAI Connection (Public - Dev Only)',
        description: 'Test OpenAI connection without authentication'
    })
    async testOpenAIPublic() {
        if (process.env.NODE_ENV !== 'development') {
            throw new BadRequestException('This endpoint is only available in development');
        }

        const connectionTest = await this.aiProcessingService.testOpenAIConnection();
        return {
            success: connectionTest.connected,
            message: connectionTest.connected ? 'OpenAI connected successfully' : 'OpenAI connection failed',
            data: connectionTest,
        };
    }
}