// File name: src/modules/property-searches/property-searches.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertySearch } from './entities/property-search.entity';
import { PropertySearchesRepository } from './property-searches.repository';
import { PropertySearchesService } from './property-searches.service';
import { PropertySearchesController } from './property-searches.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PropertySearch])],
    controllers: [PropertySearchesController],
    providers: [
        PropertySearchesRepository,
        PropertySearchesService
    ],
    exports: [
        PropertySearchesRepository,
        PropertySearchesService
    ],
})
export class PropertySearchesModule { }