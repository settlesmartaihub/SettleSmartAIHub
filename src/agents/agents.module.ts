// File name: src/agents/agents.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../modules/agents/entities/agent.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Agent]),
        PropertiesModule, // For agent property management
        UsersModule, // For lead generation
    ],
    controllers: [AgentsController],
    providers: [AgentsService],
    exports: [AgentsService],
})
export class AgentsModule { }