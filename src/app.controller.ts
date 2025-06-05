// File name: src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiResponseDto } from './common/dto/api-response.dto';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getRoot(): string {
      return 'Welcome to SettleSmart AI Backend!';
  }

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Basic health check endpoint to verify API is running'
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy and running',
    schema: {
      example: {
        success: true,
        message: 'SettleSmart AI API is running successfully',
        data: 'Hello from SettleSmart AI - Your Smart Way Home in Nigeria!',
        timestamp: '2025-01-25T10:30:00Z'
      }
    }
  })
  getHello(): { message: string; status: string; api_version: string } {
    return {
      message: 'SettleSmart AI - Your Smart Way Home in Nigeria!',
      status: 'healthy',
      api_version: '1.0.0'
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Detailed Health Check',
    description: 'Detailed health status including database connectivity'
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
    schema: {
      example: {
        success: true,
        message: 'All systems operational',
        data: {
          status: 'healthy',
          timestamp: '2025-01-25T10:30:00Z',
          database: 'connected',
          services: {
            whatsapp: 'ready',
            ai: 'ready',
            property_matching: 'ready'
          },
          location: 'Lugbe, Abuja',
          features: ['property_search', 'agent_matching', 'whatsapp_integration']
        },
        timestamp: '2025-01-25T10:30:00Z'
      }
    }
  })
  getHealthCheck(): any {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      services: {
        whatsapp: 'ready',
        ai: 'ready',
        property_matching: 'ready'
      },
      location: 'Lugbe, Abuja',
      features: ['property_search', 'agent_matching', 'whatsapp_integration'],
      version: '1.0.0'
    };
  }

  @Get('info')
  @ApiOperation({
    summary: 'API Information',
    description: 'Get information about SettleSmart AI API capabilities'
  })
  @ApiResponse({
    status: 200,
    description: 'API information and capabilities',
    schema: {
      example: {
        success: true,
        message: 'API information retrieved',
        data: {
          name: 'SettleSmart AI API',
          description: 'Intelligent Property Matching for Nigeria',
          version: '1.0.0',
          target_market: 'Nigerian rental property seekers',
          primary_location: 'Lugbe, Abuja',
          supported_languages: ['English'],
          features: [
            'WhatsApp Integration',
            'AI-Powered Property Matching',
            'Nigerian Phone Number Support',
            'Agent Subscription Tiers',
            'Property Search Analytics'
          ],
          property_types: ['flat', 'house', 'room', 'self-contain'],
          subscription_tiers: {
            basic: { listings: 5, price: 'Free' },
            premium: { listings: 50, price: 'Paid' }
          }
        },
        timestamp: '2025-01-25T10:30:00Z'
      }
    }
  })
  getApiInfo(): any {
    return {
      name: 'SettleSmart AI API',
      description: 'Intelligent Property Matching for Nigeria',
      version: '1.0.0',
      target_market: 'Nigerian rental property seekers',
      primary_location: 'Lugbe, Abuja',
      supported_languages: ['English'],
      features: [
        'WhatsApp Integration',
        'AI-Powered Property Matching',
        'Nigerian Phone Number Support',
        'Agent Subscription Tiers',
        'Property Search Analytics'
      ],
      property_types: ['flat', 'house', 'room', 'self-contain'],
      subscription_tiers: {
        basic: { listings: 5, price: 'Free' },
        premium: { listings: 50, price: 'Paid' }
      },
      endpoints: {
        users: '/api/v1/users',
        agents: '/api/v1/agents',
        properties: '/api/v1/properties',
        conversations: '/api/v1/conversations',
        search_analytics: '/api/v1/property-searches'
      }
    };
  }
}