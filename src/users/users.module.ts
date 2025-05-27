// src/users/users.module.ts - COMPLETE MODULE
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../modules/users/entities/user.entity';
import { UsersRepository } from '../modules/users/users.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        ConfigModule
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersRepository
    ],
    exports: [
        UsersService,
        TypeOrmModule.forFeature([User])
    ]
})
export class UsersModule { }