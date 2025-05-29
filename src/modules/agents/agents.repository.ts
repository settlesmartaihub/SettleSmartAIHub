// File name: src/modules/agents/agents.repository.ts

import { EntityRepository, Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';

@EntityRepository(Agent)
export class AgentsRepository extends Repository<Agent> {
    // Define custom queries and methods here
}
