// Filename: src/modules/agents/dto/update-agent.dto.ts

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAgentDto } from './create-agent.dto';

export class UpdateAgentDto extends PartialType(CreateAgentDto) {
    @ApiPropertyOptional({
        description: 'Update agent full name',
        example: 'Jane Smith Updated',
        maxLength: 100,
    })
    name?: string;

    @ApiPropertyOptional({
        description: 'Update agent email address',
        example: 'jane.updated@example.com',
        maxLength: 100,
    })
    email?: string;

    @ApiPropertyOptional({
        description: 'Update business/company name',
        example: 'Smith Premium Properties Ltd',
        maxLength: 200,
    })
    business_name?: string;

    @ApiPropertyOptional({
        description: 'Update primary operating location',
        example: 'Lugbe Phase 1 & 2, Abuja',
        maxLength: 100,
    })
    location?: string;
}