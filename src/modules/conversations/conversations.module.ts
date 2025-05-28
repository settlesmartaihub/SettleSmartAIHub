// File: src/modules/conversations/conversations.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { UsersModule } from '../../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation]),
        UsersModule, // Import for user auto-creation
    ],
    controllers: [ConversationsController],
    providers: [ConversationsRepository, ConversationsService],
    exports: [ConversationsRepository, ConversationsService],
})
export class ConversationsModule {}