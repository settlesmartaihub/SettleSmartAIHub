// File name: src/modules/agents/agents.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentsRepository } from './agents.repository';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';

// Import the verification guard
import { AgentVerificationGuard } from '../../common/guards/agent-verification.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Agent]),
        // Import modules containing services that AgentsService needs
        PropertiesModule, // For PropertiesService
        UsersModule,     // For UsersService
    ],
    controllers: [AgentsController],
    providers: [
        AgentsService,
        AgentsRepository,
        AgentVerificationGuard, // Add the guard as a provider
    ],
    exports: [
        AgentsService,
        AgentsRepository,
        AgentVerificationGuard, // Export so other modules can use it
    ],
})
export class AgentsModule { }