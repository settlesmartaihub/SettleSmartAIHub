// Filename: src/modules/property-searches/entities/property-search.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum SearchSource {
    WHATSAPP_CHAT = 'whatsapp_chat',
    MANUAL_SEARCH = 'manual_search',
    AI_RECOMMENDATION = 'ai_recommendation',
    SIMILAR_PROPERTIES = 'similar_properties',
}

export enum SearchResultQuality {
    EXCELLENT = 'excellent', // 80%+ match
    GOOD = 'good',          // 60-79% match
    FAIR = 'fair',          // 40-59% match
    POOR = 'poor',          // <40% match
}

export interface SearchCriteria {
    // Budget filters
    budget_min?: number;
    budget_max?: number;

    // Property specifications
    bedrooms?: number;
    bathrooms?: number;
    property_types?: string[]; // ['flat', 'house', 'room', 'self-contain']

    // Location filters
    location_areas?: string[]; // ['Lugbe Phase 1', 'Lugbe Phase 2']
    max_distance_km?: number;

    // Amenity requirements
    required_amenities?: string[]; // ['parking', 'security', 'power']
    preferred_amenities?: string[]; // ['internet', 'generator']

    // Additional filters
    min_rating?: number; // Agent rating filter
    max_age_days?: number; // How recent should listings be
    verified_only?: boolean;
    available_only?: boolean;
}

export interface SearchResults {
    total_found: number;
    properties_returned: number;
    matching_scores?: number[]; // Array of matching scores for returned properties
    average_score?: number;
    price_range?: {
        min: number;
        max: number;
        average: number;
    };
    location_distribution?: Record<string, number>; // Area name -> count
}

export interface SearchMetadata {
    // Query performance
    execution_time_ms?: number;
    database_queries_count?: number;

    // AI processing
    intent_confidence?: number;
    nlp_entities_extracted?: Record<string, any>;
    search_refinements_suggested?: string[];

    // User interaction
    user_satisfaction?: number; // 1-5 rating if provided
    properties_viewed?: string[]; // Property IDs user clicked/viewed
    agents_contacted?: string[]; // Agent IDs user contacted

    // Conversion tracking
    resulted_in_viewing?: boolean;
    resulted_in_contact?: boolean;
    follow_up_searches?: number;
}

@Entity('property_searches')
@Index(['user_phone'])
@Index(['created_at'])
@Index(['search_source'])
@Index(['results_count'])
@Index(['search_quality'])
export class PropertySearch {
    @ApiProperty({
        description: 'Unique identifier for the search',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'User phone number (foreign key to users)',
        example: '+2348123456789',
    })
    @Column({
        type: 'varchar',
        length: 20,
        comment: 'Nigerian phone number in international format',
    })
    user_phone: string;

    @ApiProperty({
        description: 'Search criteria used for this search',
        example: {
            budget_min: 200000,
            budget_max: 800000,
            bedrooms: 2,
            location_areas: ['Lugbe Phase 1'],
            required_amenities: ['parking', 'security']
        },
    })
    @Column({
        type: 'jsonb',
        comment: 'Detailed search criteria and filters applied',
    })
    search_criteria: SearchCriteria;

    @ApiProperty({
        description: 'Search results summary',
        example: {
            total_found: 12,
            properties_returned: 10,
            average_score: 75,
            price_range: { min: 180000, max: 900000, average: 450000 }
        },
    })
    @Column({
        type: 'jsonb',
        comment: 'Summary of search results and statistics',
    })
    search_results: SearchResults;

    @ApiProperty({
        description: 'Source of this search',
        enum: SearchSource,
        example: SearchSource.WHATSAPP_CHAT,
    })
    @Column({
        type: 'enum',
        enum: SearchSource,
        default: SearchSource.WHATSAPP_CHAT,
        comment: 'How this search was initiated',
    })
    search_source: SearchSource;

    @ApiProperty({
        description: 'Quality of search results',
        enum: SearchResultQuality,
        example: SearchResultQuality.GOOD,
    })
    @Column({
        type: 'enum',
        enum: SearchResultQuality,
        nullable: true,
        comment: 'Assessed quality of search results',
    })
    search_quality?: SearchResultQuality;

    @ApiProperty({
        description: 'Number of properties found',
        example: 12,
    })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Total number of properties found for this search',
    })
    results_count: number;

    @ApiProperty({
        description: 'Average matching score of results',
        example: 78.5,
    })
    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
        comment: 'Average matching score (0-100)',
    })
    average_matching_score?: number;

    @ApiProperty({
        description: 'Search metadata and analytics',
        example: {
            execution_time_ms: 250,
            intent_confidence: 0.95,
            properties_viewed: ['prop1', 'prop2'],
            agents_contacted: ['agent1'],
            user_satisfaction: 4
        },
    })
    @Column({
        type: 'jsonb',
        default: '{}',
        comment: 'Additional metadata for analytics and optimization',
    })
    search_metadata: SearchMetadata;

    @ApiProperty({
        description: 'Original search query if from natural language',
        example: 'I need a 2-bedroom flat in Lugbe under 800k with parking',
    })
    @Column({
        type: 'text',
        nullable: true,
        comment: 'Original user search query in natural language',
    })
    original_query?: string;

    @ApiProperty({
        description: 'Related conversation ID if from WhatsApp',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @Column({
        type: 'uuid',
        nullable: true,
        comment: 'Link to conversation that generated this search',
    })
    conversation_id?: string;

    @ApiProperty({
        description: 'Search execution timestamp',
    })
    @CreateDateColumn({
        comment: 'When this search was executed',
    })
    created_at: Date;

    // Relationships
    @ManyToOne(() => User, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_phone', referencedColumnName: 'phone_number' })
    user: User;

    // Computed properties
    get is_recent(): boolean {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return new Date(this.created_at) > dayAgo;
    }

    get has_good_results(): boolean {
        return this.results_count > 0 && (this.average_matching_score || 0) >= 60;
    }

    get is_high_intent(): boolean {
        // High intent if user provided specific criteria
        const criteria = this.search_criteria;
        return !!(
            (criteria.budget_min && criteria.budget_max) ||
            criteria.bedrooms ||
            (criteria.required_amenities && criteria.required_amenities.length > 0)
        );
    }

    get conversion_indicators(): {
        viewed_properties: number;
        contacted_agents: number;
        has_follow_up: boolean;
    } {
        const metadata = this.search_metadata;
        return {
            viewed_properties: metadata.properties_viewed?.length || 0,
            contacted_agents: metadata.agents_contacted?.length || 0,
            has_follow_up: (metadata.follow_up_searches || 0) > 0,
        };
    }

    // Helper methods
    assessSearchQuality(): SearchResultQuality {
        if (!this.average_matching_score) return SearchResultQuality.POOR;

        if (this.average_matching_score >= 80) return SearchResultQuality.EXCELLENT;
        if (this.average_matching_score >= 60) return SearchResultQuality.GOOD;
        if (this.average_matching_score >= 40) return SearchResultQuality.FAIR;
        return SearchResultQuality.POOR;
    }

    updateSearchQuality(): void {
        this.search_quality = this.assessSearchQuality();
    }

    addViewedProperty(propertyId: string): void {
        if (!this.search_metadata.properties_viewed) {
            this.search_metadata.properties_viewed = [];
        }

        if (!this.search_metadata.properties_viewed.includes(propertyId)) {
            this.search_metadata.properties_viewed.push(propertyId);
        }
    }

    addContactedAgent(agentId: string): void {
        if (!this.search_metadata.agents_contacted) {
            this.search_metadata.agents_contacted = [];
        }

        if (!this.search_metadata.agents_contacted.includes(agentId)) {
            this.search_metadata.agents_contacted.push(agentId);
        }
    }

    recordUserSatisfaction(rating: number): void {
        this.search_metadata.user_satisfaction = Math.max(1, Math.min(5, rating));
    }

    incrementFollowUpSearches(): void {
        this.search_metadata.follow_up_searches = (this.search_metadata.follow_up_searches || 0) + 1;
    }

    // Analytics methods
    getBudgetRange(): { min: number; max: number } | null {
        if (!this.search_criteria.budget_min || !this.search_criteria.budget_max) {
            return null;
        }

        return {
            min: this.search_criteria.budget_min,
            max: this.search_criteria.budget_max,
        };
    }

    getLocationPreferences(): string[] {
        return this.search_criteria.location_areas || [];
    }

    getRequiredAmenities(): string[] {
        return this.search_criteria.required_amenities || [];
    }

    // Search similarity for recommendations
    isSimilarTo(otherSearch: PropertySearch): boolean {
        const thisCriteria = this.search_criteria;
        const otherCriteria = otherSearch.search_criteria;

        // Check budget overlap
        const budgetSimilar = (
            thisCriteria.budget_min && otherCriteria.budget_min &&
            thisCriteria.budget_max && otherCriteria.budget_max &&
            Math.abs(thisCriteria.budget_min - otherCriteria.budget_min) <= 100000 &&
            Math.abs(thisCriteria.budget_max - otherCriteria.budget_max) <= 100000
        );

        // Check bedroom similarity
        const bedroomSimilar = thisCriteria.bedrooms === otherCriteria.bedrooms;

        // Check location overlap
        const locationSimilar = (
            thisCriteria.location_areas && otherCriteria.location_areas &&
            thisCriteria.location_areas.some(area =>
                otherCriteria.location_areas!.includes(area)
            )
        );

        return !!(budgetSimilar || bedroomSimilar || locationSimilar);
    }

    // Generate search insights
    generateInsights(): {
        search_efficiency: number;
        user_engagement: number;
        result_relevance: number;
        conversion_potential: number;
    } {
        const metadata = this.search_metadata;

        // Search efficiency (based on execution time and results)
        const searchEfficiency = Math.min(100,
            this.results_count > 0 ?
                Math.max(0, 100 - (metadata.execution_time_ms || 0) / 100) : 0
        );

        // User engagement (based on views and interactions)
        const userEngagement = Math.min(100,
            ((metadata.properties_viewed?.length || 0) * 20) +
            ((metadata.agents_contacted?.length || 0) * 30) +
            ((metadata.user_satisfaction || 0) * 10)
        );

        // Result relevance (based on matching scores)
        const resultRelevance = this.average_matching_score || 0;

        // Conversion potential (based on engagement and quality)
        const conversionPotential = Math.min(100,
            (userEngagement * 0.4) +
            (resultRelevance * 0.4) +
            (this.is_high_intent ? 20 : 0)
        );

        return {
            search_efficiency: Math.round(searchEfficiency),
            user_engagement: Math.round(userEngagement),
            result_relevance: Math.round(resultRelevance),
            conversion_potential: Math.round(conversionPotential),
        };
    }
}