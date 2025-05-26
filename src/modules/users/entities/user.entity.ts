// Filename: src/modules/users/entities/user.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { PropertySearch } from '../../property-searches/entities/property-search.entity';

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    BLOCKED = 'blocked',
}

export interface UserPreferences {
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[]; // ['parking', 'security', 'power', 'water', 'internet']
    propertyTypes?: string[]; // ['flat', 'house', 'room', 'self-contain']
    maxDistanceFromWork?: number; // in kilometers
    preferredAreas?: string[]; // specific areas in Lugbe
}

@Entity('users')
@Index(['phone_number'], { unique: true })
@Index(['created_at'])
@Index(['location_preference'])
export class User {
    @ApiProperty({
        description: 'Unique identifier for the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Nigerian phone number in international format',
        example: '+2348123456789',
    })
    @Column({
        type: 'varchar',
        length: 20,
        unique: true,
        comment: 'Nigerian phone number in international format (+234xxxxxxxxxx)',
    })
    phone_number: string;

    @ApiProperty({
        description: 'User full name (collected during conversation)',
        example: 'John Doe',
        required: false,
    })
    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: 'User full name, collected during WhatsApp conversation',
    })
    name?: string;

    @ApiProperty({
        description: 'Preferred location for property search',
        example: 'Lugbe, Abuja',
    })
    @Column({
        type: 'varchar',
        length: 100,
        default: 'Lugbe, Abuja',
        comment: 'Primary location preference for property search',
    })
    location_preference: string;

    @ApiProperty({
        description: 'Minimum budget for monthly rent',
        example: 200000,
    })
    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
        comment: 'Minimum monthly rent budget in Naira',
    })
    budget_min?: number;

    @ApiProperty({
        description: 'Maximum budget for monthly rent',
        example: 800000,
    })
    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
        comment: 'Maximum monthly rent budget in Naira',
    })
    budget_max?: number;

    @ApiProperty({
        description: 'User property preferences and requirements',
        example: {
            bedrooms: 2,
            bathrooms: 2,
            amenities: ['parking', 'security', 'power'],
            propertyTypes: ['flat', 'house'],
        },
    })
    @Column({
        type: 'jsonb',
        nullable: true,
        comment: 'User preferences: bedrooms, bathrooms, amenities, property types',
    })
    preferences?: UserPreferences;

    @ApiProperty({
        description: 'User account status',
        enum: UserStatus,
        example: UserStatus.ACTIVE,
    })
    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
        comment: 'User account status',
    })
    status: UserStatus;

    @ApiProperty({
        description: 'Last activity timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    @Column({
        type: 'timestamp',
        nullable: true,
        comment: 'Last time user interacted via WhatsApp',
    })
    last_activity?: Date;

    @ApiProperty({
        description: 'Number of successful property viewings',
        example: 3,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Count of properties user has viewed/inquired about',
    })
    properties_viewed: number;

    @ApiProperty({
        description: 'User registration/creation timestamp',
    })
    @CreateDateColumn({
        comment: 'User registration timestamp',
    })
    created_at: Date;

    @ApiProperty({
        description: 'Last profile update timestamp',
    })
    @UpdateDateColumn({
        comment: 'Last profile update timestamp',
    })
    updated_at: Date;

    // Relationships
    @OneToMany(() => Conversation, (conversation) => conversation.user, {
        cascade: true,
    })
    conversations: Conversation[];

    @OneToMany(() => PropertySearch, (search) => search.user, {
        cascade: true,
    })
    property_searches: PropertySearch[];

    // Computed properties
    get display_phone(): string {
        // Convert +2348123456789 to +234 812 345 6789
        if (this.phone_number?.startsWith('+234')) {
            const number = this.phone_number.slice(4);
            return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
        }
        return this.phone_number;
    }

    get is_active(): boolean {
        return this.status === UserStatus.ACTIVE;
    }

    get has_budget_set(): boolean {
        return !!(this.budget_min && this.budget_max);
    }

    get has_preferences_set(): boolean {
        return !!(this.preferences && Object.keys(this.preferences).length > 0);
    }

    // Helper methods
    updateLastActivity(): void {
        this.last_activity = new Date();
    }

    incrementPropertiesViewed(): void {
        this.properties_viewed += 1;
    }

    setBudgetRange(min: number, max: number): void {
        this.budget_min = min;
        this.budget_max = max;
    }

    updatePreferences(preferences: Partial<UserPreferences>): void {
        this.preferences = {
            ...this.preferences,
            ...preferences,
        };
    }
}