// Filename: src/modules/conversations/conversations.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationsRepository } from './conversations.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Conversation])],
    providers: [ConversationsRepository],
    exports: [ConversationsRepository],
})
export class ConversationsModule { }