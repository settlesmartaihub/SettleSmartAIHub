// File name: src/modules/properties/properties.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertiesRepository } from './properties.repository';
import { Property } from './entities/property.entity';
import { Agent } from '../agents/entities/agent.entity'; // Import Agent entity
import { User } from '../users/entities/user.entity'; // Import User entity
import { PropertyMatchingService } from '../../services/property-matching.service';

// Import the verification guard
import { AgentVerificationGuard } from '../../common/guards/agent-verification.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Property,
            Agent, // Add Agent entity so we can check verification status
            User   // Add User entity for property matching
        ]),
    ],
    controllers: [PropertiesController],
    providers: [
        PropertiesService,
        PropertiesRepository,
        PropertyMatchingService,
        AgentVerificationGuard, // Add the guard as a provider
    ],
    exports: [
        PropertiesService,
        PropertiesRepository,
        PropertyMatchingService,
    ],
})
export class PropertiesModule { }