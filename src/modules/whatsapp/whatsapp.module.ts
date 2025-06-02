// File name: src/modules/whatsapp/whatsapp.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from '../../services/whatsapp.service';
import { AIProcessingService } from '../../services/ai-processing.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { UsersModule } from '../users/users.module';
import { PropertiesModule } from '../properties/properties.module';
import { PropertySearchesModule } from '../property-searches/property-searches.module';

@Module({
    imports: [
        ConfigModule,
        ConversationsModule,
        UsersModule,
        PropertiesModule,
        PropertySearchesModule,
    ],
    controllers: [WhatsAppController],
    providers: [
        WhatsAppService,
        AIProcessingService,
    ],
    exports: [
        WhatsAppService,
        AIProcessingService,
    ],
})
export class WhatsAppModule { }