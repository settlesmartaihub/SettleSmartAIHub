// File name: src/modules/properties/properties.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Import entities
import { Property } from './entities/property.entity';
import { Agent } from '../agents/entities/agent.entity';
import { User } from '../users/entities/user.entity';

// Import main components
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertiesRepository } from './properties.repository';

// Import services
import { PropertyMatchingService } from '../../services/property-matching.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Property, Agent, User]),
        ConfigModule
    ],
    controllers: [PropertiesController],
    providers: [
        PropertiesService,
        PropertiesRepository,
        PropertyMatchingService
    ],
    exports: [
        PropertiesService,
        PropertiesRepository,
        PropertyMatchingService,
        TypeOrmModule
    ]
})
export class PropertiesModule { }