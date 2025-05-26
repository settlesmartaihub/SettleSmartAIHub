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
    it('should return health check object with correct properties', () => {
      const result = appController.getHello();

      expect(result).toEqual({
        message: 'SettleSmart AI - Your Smart Way Home in Nigeria!',
        status: 'healthy',
        api_version: '1.0.0'
      });
    });

    it('should have required properties', () => {
      const result = appController.getHello();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('api_version');
    });

    it('should return correct message', () => {
      const result = appController.getHello();

      expect(result.message).toBe('SettleSmart AI - Your Smart Way Home in Nigeria!');
    });

    it('should return healthy status', () => {
      const result = appController.getHello();

      expect(result.status).toBe('healthy');
    });

    it('should return correct API version', () => {
      const result = appController.getHello();

      expect(result.api_version).toBe('1.0.0');
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
  });
});