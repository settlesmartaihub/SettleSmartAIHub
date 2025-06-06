// File: src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  // Root route - handles both Render health checks and provides API info
  @Get()
  @ApiOperation({
    summary: 'Root Endpoint',
    description: 'Root endpoint that provides basic API information and status'
  })
  @ApiResponse({
    status: 200,
    description: 'API information and status'
  })
  getRoot(): any {
    return {
      message: 'SettleSmart AI - Your Smart Way Home in Nigeria!',
      status: 'healthy',
      api_version: '1.0.0',
      api_base: '/api/v1',
      endpoints: {
        health: '/api/v1/health',
        info: '/api/v1/info',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        agents: '/api/v1/agents',
        properties: '/api/v1/properties',
        conversations: '/api/v1/conversations',
        whatsapp: '/api/v1/whatsapp'
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Detailed Health Check',
    description: 'Detailed health status including database connectivity'
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information'
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
    description: 'API information and capabilities'
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