// File name: src/common/interfaces/search-criteria.interface.ts

import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../modules/users/entities/user.entity';

// Convert enums to const objects for better compatibility
export const SearchSource = {
    WHATSAPP_CHAT: 'whatsapp_chat',
    MANUAL_SEARCH: 'manual_search',
    AI_RECOMMENDATION: 'ai_recommendation',
    SIMILAR_PROPERTIES: 'similar_properties',
} as const;

export type SearchSourceType = typeof SearchSource[keyof typeof SearchSource];

export const SearchResultQuality = {
    EXCELLENT: 'excellent', // 80%+ match
    GOOD: 'good',          // 60-79% match
    FAIR: 'fair',          // 40-59% match
    POOR: 'poor',          // <40% match
} as const;

export type SearchResultQualityType = typeof SearchResultQuality[keyof typeof SearchResultQuality];

export interface SearchCriteria {
    // Budget filters
    minBudget?: number;
    maxBudget?: number;
    
    // Location preferences
    preferredLocations?: string[];
    maxDistanceFromWork?: number; // in kilometers
    workLocation?: string;
    
    // Property type and size
    propertyType?: string; // 'flat', 'house', 'room', 'self-contain'
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    
    // Amenities and features
    requiredAmenities?: string[];
    preferredAmenities?: string[];
    
    // Timing
    moveInDate?: Date;
    leaseDuration?: number; // in months
    
    // Accessibility and special needs
    wheelchairAccessible?: boolean;
    petFriendly?: boolean;
    
    // Quality and condition
    minPropertyCondition?: string; // 'poor', 'fair', 'good', 'excellent'
    
    // Search metadata
    searchSource?: SearchSourceType;
    userId?: string;
    sessionId?: string;
    searchTimestamp?: Date;
    
    // Flexibility indicators
    budgetFlexibility?: number; // percentage (0-100)
    locationFlexibility?: number; // percentage (0-100)
    amenityFlexibility?: number; // percentage (0-100)
}

export interface SearchResult {
    propertyId: string;
    matchScore: number; // 0-100 percentage match
    matchQuality: SearchResultQualityType;
    
    // Match breakdown
    budgetMatch: number;
    locationMatch: number;
    amenityMatch: number;
    sizeMatch: number;
    
    // Why this property was matched
    matchReasons: string[];
    potentialConcerns: string[];
    
    // Property summary for quick review
    propertyTitle: string;
    location: string;
    rent: number;
    bedrooms: number;
    bathrooms: number;
    mainAmenities: string[];
    
    // Distance calculations
    distanceFromWork?: number;
    transportOptions?: string[];
    
    // Ranking factors
    popularityScore?: number;
    recentlyViewed?: boolean;
    agentRating?: number;
    
    searchTimestamp: Date;
}

export interface SearchAnalytics {
    searchId: string;
    user: User;
    searchCriteria: SearchCriteria;
    resultsCount: number;
    avgMatchScore: number;
    topMatchScore: number;
    searchDuration: number; // in milliseconds
    
    // User interaction data
    clickedResults: string[]; // property IDs
    savedProperties: string[]; // property IDs
    contactedAgents: string[]; // agent IDs
    
    // Search refinements
    refinementCount: number;
    finalCriteria: SearchCriteria;
    
    // Quality metrics
    userSatisfactionScore?: number; // 1-5 rating
    searchAbandoned: boolean;
    completedSearch: boolean;
    
    createdAt: Date;
    updatedAt: Date;
}