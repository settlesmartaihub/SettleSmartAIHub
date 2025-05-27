// src/services/property-matching.service.ts

import { Injectable } from '@nestjs/common';
import { Property } from '../modules/properties/entities/property.entity';
import { User } from '../modules/users/entities/user.entity';

interface PropertyScore {
    property: Property;
    score: number;
    reasons: string[];
}

@Injectable()
export class PropertyMatchingService {
    async matchProperties(user: User, properties: Property[]): Promise<Property[]> {
        const scoredProperties: PropertyScore[] = [];

        for (const property of properties) {
            const score = await this.calculateMatchScore(user, property);
            scoredProperties.push(score);
        }

        // Sort by score (highest first)
        scoredProperties.sort((a, b) => b.score - a.score);

        return scoredProperties.map(item => item.property);
    }

    private async calculateMatchScore(user: User, property: Property): Promise<PropertyScore> {
        let score = 0;
        const reasons: string[] = [];

        // Budget matching (40% weight)
        const budgetScore = this.calculateBudgetScore(user, property);
        score += budgetScore * 0.4;
        if (budgetScore > 0.7) {
            reasons.push('Within your budget range');
        }

        // Location matching (25% weight)
        const locationScore = this.calculateLocationScore(user, property);
        score += locationScore * 0.25;
        if (locationScore > 0.8) {
            reasons.push('In your preferred area');
        }

        // Property type matching (20% weight)
        const typeScore = this.calculateTypeScore(user, property);
        score += typeScore * 0.2;
        if (typeScore === 1) {
            reasons.push('Matches your property type preference');
        }

        // Amenities matching (15% weight)
        const amenitiesScore = this.calculateAmenitiesScore(user, property);
        score += amenitiesScore * 0.15;
        if (amenitiesScore > 0.5) {
            reasons.push('Has your preferred amenities');
        }

        return {
            property,
            score: Math.min(score, 1), // Cap at 1.0
            reasons
        };
    }

    private calculateBudgetScore(user: User, property: Property): number {
        if (!user.budget_min || !user.budget_max) {
            return 0.5; // Neutral score if no budget set
        }

        const minBudget = Number(user.budget_min);
        const maxBudget = Number(user.budget_max);
        const price = Number(property.price);

        if (price >= minBudget && price <= maxBudget) {
            // Perfect match - within budget
            return 1.0;
        } else if (price < minBudget) {
            // Below minimum - good deal
            const difference = minBudget - price;
            const range = maxBudget - minBudget;
            return Math.max(0.8, 1 - (difference / range));
        } else {
            // Above maximum - penalize based on how much over
            const difference = price - maxBudget;
            const range = maxBudget - minBudget;
            return Math.max(0, 0.3 - (difference / range));
        }
    }

    private calculateLocationScore(user: User, property: Property): number {
        const userLocation = user.location_preference?.toLowerCase() || '';
        const propertyArea = property.location?.area?.toLowerCase() || '';

        if (propertyArea.includes(userLocation) || userLocation.includes(propertyArea)) {
            return 1.0; // Perfect location match
        }

        // Check for nearby areas (simplified)
        const nearbyAreas = {
            'lugbe': ['kuje', 'gwagwalada'],
            'kuje': ['lugbe', 'gwagwalada'],
            'gwagwalada': ['lugbe', 'kuje']
        };

        const userArea = Object.keys(nearbyAreas).find(area => userLocation.includes(area));
        if (userArea && nearbyAreas[userArea].some(nearby => propertyArea.includes(nearby))) {
            return 0.7; // Nearby area
        }

        return 0.3; // Different area
    }

    private calculateTypeScore(user: User, property: Property): number {
        const userPreferences = user.preferences as any;
        if (!userPreferences?.propertyType) {
            return 0.5; // Neutral if no preference
        }

        const preferredType = userPreferences.propertyType.toLowerCase();
        const propertyType = property.property_type.toLowerCase();

        if (preferredType === propertyType) {
            return 1.0; // Perfect match
        }

        // Similar types matching
        const similarTypes = {
            'flat': ['house'],
            'house': ['flat'],
            '2-bedroom': ['flat', 'house'],
            '3-bedroom': ['house', 'duplex']
        };

        if (similarTypes[preferredType]?.includes(propertyType)) {
            return 0.6; // Similar type
        }

        return 0.2; // Different type
    }

    private calculateAmenitiesScore(user: User, property: Property): number {
        const userPreferences = user.preferences as any;
        const preferredAmenities = userPreferences?.amenities || [];
        const propertyAmenities = property.amenities || [];

        if (preferredAmenities.length === 0) {
            return 0.5; // Neutral if no preferences
        }

        const matchingAmenities = preferredAmenities.filter(amenity =>
            Object.keys(propertyAmenities).includes(amenity)
        );

        return matchingAmenities.length / preferredAmenities.length;
    }
}