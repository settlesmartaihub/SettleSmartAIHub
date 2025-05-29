// File name: src/modules/agents/entities/agent.entity.ts

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
import { Property } from '../../properties/entities/property.entity';

export enum AgentVerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
    SUSPENDED = 'suspended',
}

export enum AgentSubscriptionTier {
    BASIC = 'basic',
    PREMIUM = 'premium',
}

export enum AgentStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('agents')
@Index(['phone_number'], { unique: true })
@Index(['email'], { unique: true })
@Index(['verification_status'])
@Index(['subscription_tier'])
@Index(['location'])
@Index(['created_at'])
export class Agent {
    @ApiProperty({
        description: 'Unique identifier for the agent',
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
        comment: 'Agent Nigerian phone number in international format',
    })
    phone_number: string;

    // UPDATED PASSWORD FIELD - Now required for new agents
    @ApiProperty({
        description: 'Encrypted password for authentication',
        writeOnly: true,
    })
    @Column({
        type: 'varchar',
        length: 255,
        select: false, // Don't include password in default selects
        nullable: false  // Make it required for security
    })
    password: string;

    @ApiProperty({
        description: 'Agent full name',
        example: 'Jane Smith',
    })
    @Column({
        type: 'varchar',
        length: 100,
        comment: 'Agent full name',
    })
    name: string;

    @ApiProperty({
        description: 'Agent email address',
        example: 'jane.smith@example.com',
    })
    @Column({
        type: 'varchar',
        length: 100,
        unique: true,
        nullable: true,
        comment: 'Agent email address for communication',
    })
    email?: string;

    @ApiProperty({
        description: 'Real estate business/company name',
        example: 'Smith Properties Ltd',
    })
    @Column({
        type: 'varchar',
        length: 200,
        nullable: true,
        comment: 'Business or company name',
    })
    business_name?: string;

    @ApiProperty({
        description: 'Agent verification status',
        enum: AgentVerificationStatus,
        example: AgentVerificationStatus.VERIFIED,
    })
    @Column({
        type: 'enum',
        enum: AgentVerificationStatus,
        default: AgentVerificationStatus.PENDING,
        comment: 'Verification status of the agent',
    })
    verification_status: AgentVerificationStatus;

    @ApiProperty({
        description: 'Agent subscription tier',
        enum: AgentSubscriptionTier,
        example: AgentSubscriptionTier.BASIC,
    })
    @Column({
        type: 'enum',
        enum: AgentSubscriptionTier,
        default: AgentSubscriptionTier.BASIC,
        comment: 'Subscription tier: basic (5 listings) or premium (50 listings)',
    })
    subscription_tier: AgentSubscriptionTier;

    @ApiProperty({
        description: 'Subscription expiration date',
        example: '2025-12-31T23:59:59Z',
    })
    @Column({
        type: 'timestamp',
        nullable: true,
        comment: 'Subscription expiration date (null for basic tier)',
    })
    subscription_expires_at?: Date;

    @ApiProperty({
        description: 'Primary operating location',
        example: 'Lugbe, Abuja',
    })
    @Column({
        type: 'varchar',
        length: 100,
        default: 'Lugbe, Abuja',
        comment: 'Primary area where agent operates',
    })
    location: string;

    @ApiProperty({
        description: 'Agent rating based on user feedback',
        example: 4.5,
    })
    @Column({
        type: 'decimal',
        precision: 3,
        scale: 2,
        default: 0,
        comment: 'Average rating from 0.00 to 5.00',
    })
    rating: number;

    @ApiProperty({
        description: 'Total number of ratings received',
        example: 25,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Total number of ratings received',
    })
    total_ratings: number;

    @ApiProperty({
        description: 'Agent account status',
        enum: AgentStatus,
        example: AgentStatus.ACTIVE,
    })
    @Column({
        type: 'enum',
        enum: AgentStatus,
        default: AgentStatus.ACTIVE,
        comment: 'Agent account status',
    })
    status: AgentStatus;

    @ApiProperty({
        description: 'Last activity timestamp',
        example: '2025-01-25T10:30:00Z',
    })
    @Column({
        type: 'timestamp',
        nullable: true,
        comment: 'Last time agent was active on the platform',
    })
    last_activity?: Date;

    @ApiProperty({
        description: 'Number of successful leads converted',
        example: 12,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Number of leads that resulted in property viewings/rentals',
    })
    successful_leads: number;

    @ApiProperty({
        description: 'Total leads received from the platform',
        example: 45,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Total number of leads received',
    })
    total_leads: number;

    @ApiProperty({
        description: 'Agent registration timestamp',
    })
    @CreateDateColumn({
        comment: 'Agent registration timestamp',
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
    @OneToMany(() => Property, (property) => property.agent, {
        cascade: true,
    })
    properties: Property[];

    // Computed properties
    get display_phone(): string {
        // Convert +2348123456789 to +234 812 345 6789
        if (this.phone_number?.startsWith('+234')) {
            const number = this.phone_number.slice(4);
            return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
        }
        return this.phone_number;
    }

    get is_verified(): boolean {
        return this.verification_status === AgentVerificationStatus.VERIFIED;
    }

    get is_active(): boolean {
        return this.status === AgentStatus.ACTIVE && this.is_verified;
    }

    get is_premium(): boolean {
        return this.subscription_tier === AgentSubscriptionTier.PREMIUM;
    }

    get subscription_active(): boolean {
        if (this.subscription_tier === AgentSubscriptionTier.BASIC) {
            return true; // Basic is always active
        }
        return this.subscription_expires_at ? new Date() < this.subscription_expires_at : false;
    }

    get max_listings(): number {
        return this.subscription_tier === AgentSubscriptionTier.PREMIUM ? 50 : 5;
    }

    get conversion_rate(): number {
        return this.total_leads > 0 ? (this.successful_leads / this.total_leads) * 100 : 0;
    }

    // Helper methods
    updateLastActivity(): void {
        this.last_activity = new Date();
    }

    incrementTotalLeads(): void {
        this.total_leads += 1;
    }

    incrementSuccessfulLeads(): void {
        this.successful_leads += 1;
    }

    updateRating(newRating: number): void {
        const totalScore = this.rating * this.total_ratings + newRating;
        this.total_ratings += 1;
        this.rating = Math.round((totalScore / this.total_ratings) * 100) / 100;
    }

    upgradeToPremium(expirationDate: Date): void {
        this.subscription_tier = AgentSubscriptionTier.PREMIUM;
        this.subscription_expires_at = expirationDate;
    }

    downgradeToBasic(): void {
        this.subscription_tier = AgentSubscriptionTier.BASIC;
        this.subscription_expires_at = undefined;
    }

    suspend(reason?: string): void {
        this.status = AgentStatus.SUSPENDED;
        this.verification_status = AgentVerificationStatus.SUSPENDED;
    }

    reactivate(): void {
        this.status = AgentStatus.ACTIVE;
        if (this.verification_status === AgentVerificationStatus.SUSPENDED) {
            this.verification_status = AgentVerificationStatus.VERIFIED;
        }
    }
}