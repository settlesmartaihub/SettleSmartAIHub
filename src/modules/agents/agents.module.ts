// File: src/modules/agents/agents.module.ts (Update existing)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentsRepository } from './agents.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Agent])],
    providers: [AgentsRepository],
    exports: [AgentsRepository],
})
export class AgentsModule {}