// Filename: src/database/entities/base.entity.ts

import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    BaseEntity as TypeORMBaseEntity
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseEntity extends TypeORMBaseEntity {
    @ApiProperty({
        description: 'Unique identifier',
        example: '550e8400-e29b-41d4-a716-446655440000'
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Record creation timestamp',
        example: '2024-01-15T10:30:00.000Z'
    })
    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        name: 'created_at'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Record last update timestamp',
        example: '2024-01-15T14:20:00.000Z'
    })
    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
        name: 'updated_at'
    })
    updatedAt: Date;

    @ApiProperty({
        description: 'Soft delete timestamp (null if not deleted)',
        example: null,
        required: false
    })
    @DeleteDateColumn({
        type: 'timestamp',
        nullable: true,
        name: 'deleted_at'
    })
    deletedAt?: Date;

    // Virtual fields for API responses
    @ApiProperty({
        description: 'Whether the record is soft deleted',
        example: false
    })
    get isDeleted(): boolean {
        return !!this.deletedAt;
    }

    @ApiProperty({
        description: 'Time since creation in milliseconds',
        example: 86400000
    })
    get createdAgo(): number {
        return Date.now() - this.createdAt.getTime();
    }

    @ApiProperty({
        description: 'Time since last update in milliseconds',
        example: 3600000
    })
    get updatedAgo(): number {
        return Date.now() - this.updatedAt.getTime();
    }
}