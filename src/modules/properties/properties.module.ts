// Filename: src/modules/properties/properties.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { PropertiesRepository } from './properties.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Property])],
    providers: [PropertiesRepository],
    exports: [PropertiesRepository],
})
export class PropertiesModule { }