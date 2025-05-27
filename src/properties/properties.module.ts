// src/properties/properties.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { Property } from '../modules/properties/entities/property.entity';
import { Agent } from '../modules/agents/entities/agent.entity';
import { User } from '../modules/users/entities/user.entity';
import { PropertyMatchingService } from '../services/property-matching.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Property, Agent, User]),
        ConfigModule
    ],
    controllers: [PropertiesController],
    providers: [
        PropertiesService,
        PropertyMatchingService
    ],
    exports: [
        PropertiesService,
        PropertyMatchingService,
        TypeOrmModule.forFeature([Property])
    ]
})
export class PropertiesModule { }