// File name: src/modules/agents/agents.module.ts (Update existing)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentsRepository } from './agents.repository';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Agent]),
        // Import modules containing services that AgentsService needs
        PropertiesModule, // For PropertiesService
        UsersModule,     // For UsersService
    ],
    controllers: [AgentsController],
    providers: [AgentsService, AgentsRepository],
    exports: [AgentsService, AgentsRepository],
})
export class AgentsModule { }