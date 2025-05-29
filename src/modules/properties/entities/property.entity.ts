// File name: src/modules/properties/entities/property.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Agent } from '../../agents/entities/agent.entity';

export enum PropertyType {
    FLAT = 'flat',
    HOUSE = 'house',
    ROOM = 'room',
    SELF_CONTAIN = 'self-contain',
}

export enum PropertyVerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
}

export enum PropertyStatus {
    AVAILABLE = 'available',
    RENTED = 'rented',
    MAINTENANCE = 'maintenance',
    INACTIVE = 'inactive',
}

export interface PropertyAmenities {
    parking?: boolean;
    security?: boolean;
    power?: boolean; // Stable electricity
    water?: boolean; // Running water
    internet?: boolean;
    generator?: boolean;
    aircon?: boolean;
    furnished?: boolean;
    kitchen?: boolean;
    balcony?: boolean;
}

export interface PropertyLocation {
    area: string; // Specific area within Lugbe
    address?: string; // Full address - ADD THIS LINE
    landmark?: string; // Nearby landmark
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

@Entity('properties')
@Index(['agent_id'])
@Index(['property_type'])
@Index(['price'])
@Index(['location'])
@Index(['verification_status'])
@Index(['status'])
@Index(['bedrooms'])
@Index(['created_at'])
@Index(['is_available'])
export class Property {
    @ApiProperty({
        description: 'Unique identifier for the property',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Agent who listed this property',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @Column({
        type: 'uuid',
        nullable: true, // Made nullable to avoid conflicts
        comment: 'Reference to the agent who owns this listing',
    })
    agent_id?: string;

    @ApiProperty({
        description: 'Property title/headline',
        example: 'Beautiful 2-Bedroom Flat in Lugbe Phase 1',
    })
    @Column({
        type: 'varchar',
        length: 200,
        comment: 'Property title or headline',
    })
    title: string;

    @ApiProperty({
        description: 'Detailed property description',
        example: 'Spacious 2-bedroom flat with modern amenities in a secure estate...',
    })
    @Column({
        type: 'text',
        nullable: true,
        comment: 'Detailed description of the property',
    })
    description?: string;

    @ApiProperty({
        description: 'Type of property',
        enum: PropertyType,
        example: PropertyType.FLAT,
    })
    @Column({
        type: 'enum',
        enum: PropertyType,
        comment: 'Property type: flat, house, room, or self-contain',
    })
    property_type: PropertyType;

    @ApiProperty({
        description: 'Monthly rent price in Naira',
        example: 650000,
    })
    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        comment: 'Monthly rent price in Nigerian Naira',
    })
    price: number;

    @ApiProperty({
        description: 'Property location details',
        example: {
            area: 'Lugbe Phase 1',
            landmark: 'Near Lugbe Market',
            coordinates: { latitude: 8.7832, longitude: 7.3986 },
        },
    })
    @Column({
        type: 'jsonb',
        comment: 'Location details including area, landmark, and coordinates',
    })
    location: PropertyLocation;

    @ApiProperty({
        description: 'Number of bedrooms',
        example: 2,
    })
    @Column({
        type: 'int',
        comment: 'Number of bedrooms',
    })
    bedrooms: number;

    @ApiProperty({
        description: 'Number of bathrooms',
        example: 2,
    })
    @Column({
        type: 'int',
        comment: 'Number of bathrooms',
    })
    bathrooms: number;

    @ApiProperty({
        description: 'Property amenities and features',
        example: {
            parking: true,
            security: true,
            power: true,
            water: true,
            internet: false,
            generator: true,
        },
    })
    @Column({
        type: 'jsonb',
        comment: 'Available amenities and features',
    })
    amenities: PropertyAmenities;

    @ApiProperty({
        description: 'Array of property image URLs',
        example: [
            'https://example.com/images/property1_1.jpg',
            'https://example.com/images/property1_2.jpg',
        ],
    })
    @Column({
        type: 'text',
        array: true,
        default: '{}',
        comment: 'Array of image URLs',
    })
    images: string[];

    @ApiProperty({
        description: 'Property verification status',
        enum: PropertyVerificationStatus,
        example: PropertyVerificationStatus.VERIFIED,
    })
    @Column({
        type: 'enum',
        enum: PropertyVerificationStatus,
        default: PropertyVerificationStatus.PENDING,
        comment: 'Admin verification status',
    })
    verification_status: PropertyVerificationStatus;

    @ApiProperty({
        description: 'Property availability status',
        enum: PropertyStatus,
        example: PropertyStatus.AVAILABLE,
    })
    @Column({
        type: 'enum',
        enum: PropertyStatus,
        default: PropertyStatus.AVAILABLE,
        comment: 'Current property status',
    })
    status: PropertyStatus;

    @ApiProperty({
        description: 'Whether property is currently available for rent',
        example: true,
    })
    @Column({
        type: 'boolean',
        default: true,
        comment: 'Quick availability flag',
    })
    is_available: boolean;

    @ApiProperty({
        description: 'Number of inquiries received for this property',
        example: 8,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Number of user inquiries received',
    })
    inquiry_count: number;

    @ApiProperty({
        description: 'Number of times property was viewed/shown',
        example: 3,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Number of property viewings',
    })
    view_count: number;

    @ApiProperty({
        description: 'Date when property was rented (if applicable)',
    })
    @Column({
        type: 'timestamp',
        nullable: true,
        comment: 'Date property was rented out',
    })
    rented_at?: Date;

    @ApiProperty({
        description: 'Property listing creation timestamp',
    })
    @CreateDateColumn({
        comment: 'Property listing creation timestamp',
    })
    created_at: Date;

    @ApiProperty({
        description: 'Last property update timestamp',
    })
    @UpdateDateColumn({
        comment: 'Last property update timestamp',
    })
    updated_at: Date;

    // Relationships - Only ONE agent relationship
    @ManyToOne(() => Agent, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'agent_id' })
    agent?: Agent;

    // Computed properties
    get is_verified(): boolean {
        return this.verification_status === PropertyVerificationStatus.VERIFIED;
    }

    get is_rentable(): boolean {
        return (
            this.is_available &&
            this.status === PropertyStatus.AVAILABLE &&
            this.is_verified
        );
    }

    get formatted_price(): string {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(this.price);
    }

    get location_display(): string {
        return this.location.landmark
            ? `${this.location.area}, Near ${this.location.landmark}`
            : this.location.area;
    }

    get property_summary(): string {
        return `${this.bedrooms}BR ${this.property_type} in ${this.location.area} - ${this.formatted_price}/month`;
    }

    get amenities_list(): string[] {
        return Object.entries(this.amenities)
            .filter(([_, value]) => value === true)
            .map(([key, _]) => key);
    }

    get has_images(): boolean {
        return this.images && this.images.length > 0;
    }

    // Enhanced computed properties
    get formattedPrice(): string {
        return `₦${Number(this.price).toLocaleString('en-NG')}`;
    }

    get propertySummary(): string {
        return `${this.bedrooms}BR/${this.bathrooms}BA ${this.property_type} in ${this.location?.area} - ${this.formattedPrice}`;
    }

    get isAvailable(): boolean {
        return this.status === PropertyStatus.AVAILABLE && this.is_available === true;
    }

    get engagementScore(): number {
        const viewWeight = 0.3;
        const inquiryWeight = 0.7;
        return (this.view_count * viewWeight) + (this.inquiry_count * inquiryWeight);
    }

    get daysSinceListed(): number {
        const now = new Date();
        const created = new Date(this.created_at);
        const diffTime = Math.abs(now.getTime() - created.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Helper methods
    incrementInquiryCount(): void {
        this.inquiry_count += 1;
    }

    incrementViewCount(): void {
        this.view_count += 1;
    }

    markAsRented(): void {
        this.status = PropertyStatus.RENTED;
        this.is_available = false;
        this.rented_at = new Date();
    }

    markAsAvailable(): void {
        this.status = PropertyStatus.AVAILABLE;
        this.is_available = true;
        this.rented_at = undefined;
    }

    updateVerificationStatus(status: PropertyVerificationStatus): void {
        this.verification_status = status;
    }

    addImage(imageUrl: string): void {
        if (!this.images) {
            this.images = [];
        }
        this.images.push(imageUrl);
    }

    removeImage(imageUrl: string): void {
        if (this.images) {
            this.images = this.images.filter(url => url !== imageUrl);
        }
    }

    updateAmenities(amenities: Partial<PropertyAmenities>): void {
        this.amenities = {
            ...this.amenities,
            ...amenities,
        };
    }

    updateLocation(location: Partial<PropertyLocation>): void {
        this.location = {
            ...this.location,
            ...location,
        };
    }

    addImages(imageUrls: string[]): void {
        if (!this.images) {
            this.images = [];
        }
        this.images = [...this.images, ...imageUrls];
    }

    // Matching score for user preferences (0-100)
    calculateMatchingScore(userPreferences: {
        budgetMin?: number;
        budgetMax?: number;
        bedrooms?: number;
        propertyTypes?: string[];
        requiredAmenities?: string[];
    }): number {
        let score = 0;
        let totalFactors = 0;

        // Budget matching (40% weight)
        if (userPreferences.budgetMin && userPreferences.budgetMax) {
            totalFactors += 40;
            if (this.price >= userPreferences.budgetMin && this.price <= userPreferences.budgetMax) {
                score += 40;
            } else if (this.price <= userPreferences.budgetMax * 1.1) {
                // Within 10% of budget, partial score
                score += 20;
            }
        }

        // Bedroom matching (30% weight)
        if (userPreferences.bedrooms) {
            totalFactors += 30;
            if (this.bedrooms === userPreferences.bedrooms) {
                score += 30;
            } else if (Math.abs(this.bedrooms - userPreferences.bedrooms) === 1) {
                // One bedroom difference, partial score
                score += 15;
            }
        }

        // Property type matching (20% weight)
        if (userPreferences.propertyTypes && userPreferences.propertyTypes.length > 0) {
            totalFactors += 20;
            if (userPreferences.propertyTypes.includes(this.property_type)) {
                score += 20;
            }
        }

        // Amenities matching (10% weight)
        if (userPreferences.requiredAmenities && userPreferences.requiredAmenities.length > 0) {
            totalFactors += 10;
            const availableAmenities = this.amenities_list;
            const matchingAmenities = userPreferences.requiredAmenities.filter(amenity =>
                availableAmenities.includes(amenity)
            );
            const amenityScore = (matchingAmenities.length / userPreferences.requiredAmenities.length) * 10;
            score += amenityScore;
        }

        return totalFactors > 0 ? Math.round((score / totalFactors) * 100) : 0;
    }
}