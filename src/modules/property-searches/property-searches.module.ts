// File name: src/modules/property-searches/property-searches.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertySearch } from './entities/property-search.entity';
import { PropertySearchesRepository } from './property-searches.repository';

@Module({
    imports: [TypeOrmModule.forFeature([PropertySearch])],
    providers: [PropertySearchesRepository],
    exports: [PropertySearchesRepository],
})
export class PropertySearchesModule { }