// src/modules/users/entities/user.entity.ts
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
    SUSPENDED = 'suspended'
}

export interface UserPreferences {
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    propertyTypes?: string[];
    maxDistanceFromWork?: number;
    preferredAreas?: string[];
    propertyType?: string;
    furnished?: boolean;
    petFriendly?: boolean;
    utilities?: string[];
    maxCommute?: number;
    [key: string]: any;
}

@Entity('users')
@Index(['phone_number'], { unique: true })
@Index(['created_at'])
@Index(['location_preference'])
@Index(['status'])
@Index(['budget_min', 'budget_max'])
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

    // Alias for compatibility
    get phone(): string {
        return this.phone_number;
    }

    set phone(value: string) {
        this.phone_number = value;
    }

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

    // Alias for compatibility
    get location(): string {
        return this.location_preference;
    }

    set location(value: string) {
        this.location_preference = value;
    }

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

    // Alias for compatibility
    get budgetMin(): number {
        return Number(this.budget_min);
    }

    set budgetMin(value: number) {
        this.budget_min = value;
    }

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

    // Alias for compatibility
    get budgetMax(): number {
        return Number(this.budget_max);
    }

    set budgetMax(value: number) {
        this.budget_max = value;
    }

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
        default: {},
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
        description: 'WhatsApp conversation state',
        example: {
            currentStep: 'searching',
            lastMessageAt: '2025-05-27T10:30:00.000Z',
            context: {}
        }
    })
    @Column({
        type: 'jsonb',
        default: {
            currentStep: 'greeting',
            lastMessageAt: null,
            context: {}
        },
        comment: 'WhatsApp conversation state and context'
    })
    conversationState: Record<string, any>;

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

    // Alias for compatibility
    get createdAt(): Date {
        return this.created_at;
    }

    @ApiProperty({
        description: 'Last profile update timestamp',
    })
    @UpdateDateColumn({
        comment: 'Last profile update timestamp',
    })
    updated_at: Date;

    // Alias for compatibility
    get updatedAt(): Date {
        return this.updated_at;
    }

    // Relationships
    @OneToMany(() => Conversation, (conversation) => conversation.user, {
        cascade: true,
    })
    conversations: Conversation[];

    @OneToMany(() => PropertySearch, (search) => search.user, {
        cascade: true,
    })
    property_searches: PropertySearch[];

    // Alias for compatibility
    get searches(): PropertySearch[] {
        return this.property_searches;
    }

    // Computed Properties
    @ApiProperty({
        description: 'Formatted budget range display',
        example: '₦500,000 - ₦1,000,000'
    })
    get budgetRange(): string {
        if (!this.budget_min && !this.budget_max) {
            return 'Not specified';
        }

        const formatCurrency = (amount: number) =>
            `₦${amount.toLocaleString('en-NG')}`;

        if (this.budget_min && this.budget_max) {
            return `${formatCurrency(Number(this.budget_min))} - ${formatCurrency(Number(this.budget_max))}`;
        } else if (this.budget_min) {
            return `From ${formatCurrency(Number(this.budget_min))}`;
        } else {
            return `Up to ${formatCurrency(Number(this.budget_max))}`;
        }
    }

    @ApiProperty({
        description: 'Current conversation step',
        example: 'searching'
    })
    get currentConversationStep(): string {
        return this.conversationState?.currentStep || 'greeting';
    }

    @ApiProperty({
        description: 'Whether user has active search criteria',
        example: true
    })
    get hasSearchCriteria(): boolean {
        return !!(this.budget_min || this.budget_max ||
            Object.keys(this.preferences || {}).length > 0);
    }

    @ApiProperty({
        description: 'User activity status',
        example: true
    })
    get isActive(): boolean {
        return this.status === UserStatus.ACTIVE;
    }

    @ApiProperty({
        description: 'Days since last conversation',
        example: 2
    })
    
    get daysSinceLastMessage(): number {
        const lastMessage = this.conversationState?.lastMessageAt;
        if (!lastMessage) return Infinity;

        const lastMessageDate = new Date(lastMessage);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastMessageDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Legacy computed properties
    get display_phone(): string {
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