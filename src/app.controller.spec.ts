// File name: src/app.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return root endpoint with correct properties', () => {
      const result = appController.getRoot();
      expect(result).toEqual({
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
        timestamp: expect.any(String)
      });
    });

    it('should have required properties', () => {
      const result = appController.getRoot();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('api_version');
      expect(result).toHaveProperty('api_base');
      expect(result).toHaveProperty('endpoints');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return correct message', () => {
      const result = appController.getRoot();
      expect(result.message).toBe('SettleSmart AI - Your Smart Way Home in Nigeria!');
    });

    it('should return healthy status', () => {
      const result = appController.getRoot();
      expect(result.status).toBe('healthy');
    });

    it('should return correct API version', () => {
      const result = appController.getRoot();
      expect(result.api_version).toBe('1.0.0');
    });

    it('should return valid timestamp', () => {
      const result = appController.getRoot();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return correct endpoints', () => {
      const result = appController.getRoot();
      expect(result.endpoints).toHaveProperty('health', '/api/v1/health');
      expect(result.endpoints).toHaveProperty('info', '/api/v1/info');
      expect(result.endpoints).toHaveProperty('auth', '/api/v1/auth');
      expect(result.endpoints).toHaveProperty('users', '/api/v1/users');
      expect(result.endpoints).toHaveProperty('agents', '/api/v1/agents');
      expect(result.endpoints).toHaveProperty('properties', '/api/v1/properties');
      expect(result.endpoints).toHaveProperty('conversations', '/api/v1/conversations');
      expect(result.endpoints).toHaveProperty('whatsapp', '/api/v1/whatsapp');
    });
  });

  describe('health endpoint', () => {
    it('should return detailed health check', () => {
      const result = appController.getHealthCheck();
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('location', 'Lugbe, Abuja');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return correct services status', () => {
      const result = appController.getHealthCheck();
      expect(result.services).toHaveProperty('whatsapp', 'ready');
      expect(result.services).toHaveProperty('ai', 'ready');
      expect(result.services).toHaveProperty('property_matching', 'ready');
    });

    it('should return correct features array', () => {
      const result = appController.getHealthCheck();
      expect(result.features).toEqual(['property_search', 'agent_matching', 'whatsapp_integration']);
    });

    it('should return valid timestamp', () => {
      const result = appController.getHealthCheck();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('info endpoint', () => {
    it('should return API information', () => {
      const result = appController.getApiInfo();
      expect(result).toHaveProperty('name', 'SettleSmart AI API');
      expect(result).toHaveProperty('description', 'Intelligent Property Matching for Nigeria');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('target_market', 'Nigerian rental property seekers');
      expect(result).toHaveProperty('primary_location', 'Lugbe, Abuja');
      expect(result).toHaveProperty('supported_languages');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('property_types');
      expect(result).toHaveProperty('subscription_tiers');
      expect(result).toHaveProperty('endpoints');
    });

    it('should return correct supported languages', () => {
      const result = appController.getApiInfo();
      expect(result.supported_languages).toEqual(['English']);
    });

    it('should return correct features array', () => {
      const result = appController.getApiInfo();
      expect(result.features).toEqual([
        'WhatsApp Integration',
        'AI-Powered Property Matching',
        'Nigerian Phone Number Support',
        'Agent Subscription Tiers',
        'Property Search Analytics'
      ]);
    });

    it('should return correct property types', () => {
      const result = appController.getApiInfo();
      expect(result.property_types).toEqual(['flat', 'house', 'room', 'self-contain']);
    });

    it('should return correct subscription tiers', () => {
      const result = appController.getApiInfo();
      expect(result.subscription_tiers).toEqual({
        basic: { listings: 5, price: 'Free' },
        premium: { listings: 50, price: 'Paid' }
      });
    });

    it('should return correct API endpoints', () => {
      const result = appController.getApiInfo();
      expect(result.endpoints).toEqual({
        users: '/api/v1/users',
        agents: '/api/v1/agents',
        properties: '/api/v1/properties',
        conversations: '/api/v1/conversations',
        search_analytics: '/api/v1/property-searches'
      });
    });
  });
});