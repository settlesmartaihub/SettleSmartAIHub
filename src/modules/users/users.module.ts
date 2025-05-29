import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Import entities
import { User } from './entities/user.entity';

// Import main components
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

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
        UsersRepository,
        TypeOrmModule
    ]
})
export class UsersModule { }