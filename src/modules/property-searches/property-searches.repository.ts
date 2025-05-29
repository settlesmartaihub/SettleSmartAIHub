// File name: src/modules/property-searches/property-searches.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import {
    PropertySearch,
    SearchSource,
    SearchResultQuality,
} from './entities/property-search.entity';
import { CreatePropertySearchDto } from './dto/create-property-search.dto';
import { SearchAnalyticsDto } from './dto/search-analytics.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class PropertySearchesRepository {
    constructor(
        @InjectRepository(PropertySearch)
        private readonly propertySearchRepository: Repository<PropertySearch>,
    ) { }

    // Create a new property search record
    async create(createPropertySearchDto: CreatePropertySearchDto): Promise<PropertySearch> {
        const propertySearch = this.propertySearchRepository.create({
            ...createPropertySearchDto,
            search_source: createPropertySearchDto.search_source || SearchSource.WHATSAPP_CHAT,
            results_count: createPropertySearchDto.results_count || createPropertySearchDto.search_results.total_found || 0,
            search_metadata: createPropertySearchDto.search_metadata || {},
        });

        // Auto-assess search quality if not provided
        if (!propertySearch.search_quality && propertySearch.average_matching_score) {
            propertySearch.updateSearchQuality();
        }

        return await this.propertySearchRepository.save(propertySearch);
    }

    // Find property search by ID
    async findById(id: string): Promise<PropertySearch | null> {
        return await this.propertySearchRepository.findOne({
            where: { id },
            relations: ['user'],
        });
    }

    // Find searches by user phone
    async findByUserPhone(
        userPhone: string,
        limit: number = 20,
    ): Promise<PropertySearch[]> {
        return await this.propertySearchRepository.find({
            where: { user_phone: userPhone },
            relations: ['user'],
            order: { created_at: 'DESC' },
            take: limit,
        });
    }

    // Find recent searches by user
    async findRecentByUser(
        userPhone: string,
        hours: number = 24,
    ): Promise<PropertySearch[]> {
        const fromDate = new Date();
        fromDate.setHours(fromDate.getHours() - hours);

        return await this.propertySearchRepository.find({
            where: {
                user_phone: userPhone,
                created_at: MoreThan(fromDate),
            },
            relations: ['user'],
            order: { created_at: 'DESC' },
        });
    }

    // Search with analytics filters
    async searchWithAnalytics(
        analyticsDto: SearchAnalyticsDto,
    ): Promise<PaginatedResponse<PropertySearch>> {
        const {
            user_phone,
            search_source,
            search_quality,
            from_date,
            to_date,
            min_results,
            max_results,
            min_score,
            page = 1,
            limit = 20,
        } = analyticsDto;

        const queryBuilder = this.propertySearchRepository
            .createQueryBuilder('search')
            .leftJoinAndSelect('search.user', 'user');

        // Apply filters
        if (user_phone) {
            queryBuilder.andWhere('search.user_phone = :user_phone', { user_phone });
        }

        if (search_source) {
            queryBuilder.andWhere('search.search_source = :search_source', { search_source });
        }

        if (search_quality) {
            queryBuilder.andWhere('search.search_quality = :search_quality', { search_quality });
        }

        if (from_date) {
            queryBuilder.andWhere('search.created_at >= :from_date', { from_date });
        }

        if (to_date) {
            queryBuilder.andWhere('search.created_at <= :to_date', { to_date });
        }

        if (min_results !== undefined) {
            queryBuilder.andWhere('search.results_count >= :min_results', { min_results });
        }

        if (max_results !== undefined) {
            queryBuilder.andWhere('search.results_count <= :max_results', { max_results });
        }

        if (min_score !== undefined) {
            queryBuilder.andWhere('search.average_matching_score >= :min_score', { min_score });
        }

        // Add pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        // Add ordering
        queryBuilder.orderBy('search.created_at', 'DESC');

        // Execute query
        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    // Record property view interaction
    async recordPropertyView(
        searchId: string,
        propertyId: string,
    ): Promise<PropertySearch | null> {
        const search = await this.findById(searchId);
        if (!search) return null;

        search.addViewedProperty(propertyId);
        return await this.propertySearchRepository.save(search);
    }

    // Record agent contact interaction
    async recordAgentContact(
        searchId: string,
        agentId: string,
    ): Promise<PropertySearch | null> {
        const search = await this.findById(searchId);
        if (!search) return null;

        search.addContactedAgent(agentId);
        search.search_metadata.resulted_in_contact = true;
        return await this.propertySearchRepository.save(search);
    }

    // Record user satisfaction rating
    async recordSatisfactionRating(
        searchId: string,
        rating: number,
    ): Promise<PropertySearch | null> {
        const search = await this.findById(searchId);
        if (!search) return null;

        search.recordUserSatisfaction(rating);
        return await this.propertySearchRepository.save(search);
    }

    // Find similar searches for recommendations
    async findSimilarSearches(
        searchId: string,
        limit: number = 10,
    ): Promise<PropertySearch[]> {
        const baseSearch = await this.findById(searchId);
        if (!baseSearch) return [];

        // Find searches with similar criteria
        const queryBuilder = this.propertySearchRepository
            .createQueryBuilder('search')
            .leftJoinAndSelect('search.user', 'user')
            .where('search.id != :searchId', { searchId })
            .andWhere('search.user_phone != :userPhone', { userPhone: baseSearch.user_phone });

        // Budget similarity (within 20% range)
        const budgetMin = baseSearch.search_criteria.budget_min;
        const budgetMax = baseSearch.search_criteria.budget_max;
        if (budgetMin && budgetMax) {
            const budgetRange = (budgetMax - budgetMin) * 0.2;
            queryBuilder.andWhere(`
        (search.search_criteria->>'budget_min')::numeric BETWEEN :minBudgetLow AND :minBudgetHigh
        AND (search.search_criteria->>'budget_max')::numeric BETWEEN :maxBudgetLow AND :maxBudgetHigh
      `, {
                minBudgetLow: budgetMin - budgetRange,
                minBudgetHigh: budgetMin + budgetRange,
                maxBudgetLow: budgetMax - budgetRange,
                maxBudgetHigh: budgetMax + budgetRange,
            });
        }

        // Same bedroom count
        if (baseSearch.search_criteria.bedrooms) {
            queryBuilder.andWhere(
                "(search.search_criteria->>'bedrooms')::int = :bedrooms",
                { bedrooms: baseSearch.search_criteria.bedrooms }
            );
        }

        // Location similarity
        if (baseSearch.search_criteria.location_areas && baseSearch.search_criteria.location_areas.length > 0) {
            queryBuilder.andWhere(
                "search.search_criteria->'location_areas' ?| :locationAreas",
                { locationAreas: baseSearch.search_criteria.location_areas }
            );
        }

        return await queryBuilder
            .orderBy('search.created_at', 'DESC')
            .take(limit)
            .getMany();
    }

    // Get search analytics and insights
    async getSearchAnalytics(days: number = 30): Promise<{
        total_searches: number;
        successful_searches: number;
        average_results_per_search: number;
        average_matching_score: number;
        by_source: Record<SearchSource, number>;
        by_quality: Record<SearchResultQuality, number>;
        top_search_criteria: {
            budget_ranges: Array<{ range: string; count: number }>;
            popular_bedrooms: Array<{ bedrooms: number; count: number }>;
            popular_locations: Array<{ location: string; count: number }>;
            popular_amenities: Array<{ amenity: string; count: number }>;
        };
        conversion_metrics: {
            properties_viewed_rate: number;
            agents_contacted_rate: number;
            follow_up_searches_rate: number;
        };
    }> {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const [
            totalSearches,
            successfulSearches,
            averageData,
        ] = await Promise.all([
            this.propertySearchRepository.count({
                where: { created_at: MoreThan(fromDate) },
            }),
            this.propertySearchRepository.count({
                where: {
                    created_at: MoreThan(fromDate),
                    results_count: MoreThan(0),
                },
            }),
            this.propertySearchRepository
                .createQueryBuilder('search')
                .select('AVG(search.results_count)', 'avg_results')
                .addSelect('AVG(search.average_matching_score)', 'avg_score')
                .where('search.created_at > :fromDate', { fromDate })
                .getRawOne(),
        ]);

        // Get distribution by source
        const sourceStats = await this.propertySearchRepository
            .createQueryBuilder('search')
            .select('search.search_source', 'source')
            .addSelect('COUNT(*)', 'count')
            .where('search.created_at > :fromDate', { fromDate })
            .groupBy('search.search_source')
            .getRawMany();

        const bySource = Object.values(SearchSource).reduce((acc, source) => {
            acc[source] = 0;
            return acc;
        }, {} as Record<SearchSource, number>);

        sourceStats.forEach(({ source, count }) => {
            bySource[source] = parseInt(count, 10);
        });

        // Get distribution by quality
        const qualityStats = await this.propertySearchRepository
            .createQueryBuilder('search')
            .select('search.search_quality', 'quality')
            .addSelect('COUNT(*)', 'count')
            .where('search.created_at > :fromDate', { fromDate })
            .andWhere('search.search_quality IS NOT NULL')
            .groupBy('search.search_quality')
            .getRawMany();

        const byQuality = Object.values(SearchResultQuality).reduce((acc, quality) => {
            acc[quality] = 0;
            return acc;
        }, {} as Record<SearchResultQuality, number>);

        qualityStats.forEach(({ quality, count }) => {
            if (quality) {
                byQuality[quality] = parseInt(count, 10);
            }
        });

        // Get budget ranges
        const budgetRanges = await this.propertySearchRepository
            .createQueryBuilder('search')
            .select(`
        CASE 
          WHEN (search.search_criteria->>'budget_max')::numeric <= 300000 THEN 'Under ₦300k'
          WHEN (search.search_criteria->>'budget_max')::numeric <= 500000 THEN '₦300k - ₦500k'
          WHEN (search.search_criteria->>'budget_max')::numeric <= 700000 THEN '₦500k - ₦700k'
          WHEN (search.search_criteria->>'budget_max')::numeric <= 1000000 THEN '₦700k - ₦1M'
          ELSE 'Over ₦1M'
        END
      `, 'range')
            .addSelect('COUNT(*)', 'count')
            .where('search.created_at > :fromDate', { fromDate })
            .andWhere("search.search_criteria->>'budget_max' IS NOT NULL")
            .groupBy('range')
            .orderBy('count', 'DESC')
            .getRawMany();

        // Get popular bedrooms
        const popularBedrooms = await this.propertySearchRepository
            .createQueryBuilder('search')
            .select("(search.search_criteria->>'bedrooms')::int", 'bedrooms')
            .addSelect('COUNT(*)', 'count')
            .where('search.created_at > :fromDate', { fromDate })
            .andWhere("search.search_criteria->>'bedrooms' IS NOT NULL")
            .groupBy('bedrooms')
            .orderBy('count', 'DESC')
            .take(5)
            .getRawMany();

        // Get popular locations
        const popularLocations = await this.propertySearchRepository
            .createQueryBuilder('search')
            .select("jsonb_array_elements_text(search.search_criteria->'location_areas')", 'location')
            .addSelect('COUNT(*)', 'count')
            .where('search.created_at > :fromDate', { fromDate })
            .andWhere("search.search_criteria->'location_areas' IS NOT NULL")
            .groupBy('location')
            .orderBy('count', 'DESC')
            .take(10)
            .getRawMany();

        // Get popular amenities
        const popularAmenities = await this.propertySearchRepository
            .createQueryBuilder('search')
            .select("jsonb_array_elements_text(search.search_criteria->'required_amenities')", 'amenity')
            .addSelect('COUNT(*)', 'count')
            .where('search.created_at > :fromDate', { fromDate })
            .andWhere("search.search_criteria->'required_amenities' IS NOT NULL")
            .groupBy('amenity')
            .orderBy('count', 'DESC')
            .take(10)
            .getRawMany();

        // Calculate conversion metrics
        const conversionData = await this.propertySearchRepository
            .createQueryBuilder('search')
            .select('COUNT(*)', 'total')
            .addSelect(`
        COUNT(CASE WHEN jsonb_array_length(search.search_metadata->'properties_viewed') > 0 THEN 1 END)
      `, 'viewed')
            .addSelect(`
        COUNT(CASE WHEN jsonb_array_length(search.search_metadata->'agents_contacted') > 0 THEN 1 END)
      `, 'contacted')
            .addSelect(`
        COUNT(CASE WHEN (search.search_metadata->>'follow_up_searches')::int > 0 THEN 1 END)
      `, 'follow_up')
            .where('search.created_at > :fromDate', { fromDate })
            .getRawOne();

        const total = parseInt(conversionData.total, 10) || 1;

        return {
            total_searches: totalSearches,
            successful_searches: successfulSearches,
            average_results_per_search: Math.round(parseFloat(averageData?.avg_results) || 0),
            average_matching_score: Math.round(parseFloat(averageData?.avg_score) || 0),
            by_source: bySource,
            by_quality: byQuality,
            top_search_criteria: {
                budget_ranges: budgetRanges.map(({ range, count }) => ({
                    range,
                    count: parseInt(count, 10),
                })),
                popular_bedrooms: popularBedrooms.map(({ bedrooms, count }) => ({
                    bedrooms: parseInt(bedrooms, 10),
                    count: parseInt(count, 10),
                })),
                popular_locations: popularLocations.map(({ location, count }) => ({
                    location,
                    count: parseInt(count, 10),
                })),
                popular_amenities: popularAmenities.map(({ amenity, count }) => ({
                    amenity,
                    count: parseInt(count, 10),
                })),
            },
            conversion_metrics: {
                properties_viewed_rate: Math.round((parseInt(conversionData.viewed, 10) / total) * 100),
                agents_contacted_rate: Math.round((parseInt(conversionData.contacted, 10) / total) * 100),
                follow_up_searches_rate: Math.round((parseInt(conversionData.follow_up, 10) / total) * 100),
            },
        };
    }

    // Get user search patterns
    async getUserSearchPatterns(userPhone: string): Promise<{
        total_searches: number;
        successful_searches: number;
        favorite_budget_range: { min: number; max: number } | null;
        preferred_bedrooms: number | null;
        preferred_locations: string[];
        most_searched_amenities: string[];
        search_frequency_days: number;
    }> {
        const searches = await this.propertySearchRepository.find({
            where: { user_phone: userPhone },
            order: { created_at: 'DESC' },
        });

        if (searches.length === 0) {
            return {
                total_searches: 0,
                successful_searches: 0,
                favorite_budget_range: null,
                preferred_bedrooms: null,
                preferred_locations: [],
                most_searched_amenities: [],
                search_frequency_days: 0,
            };
        }

        const successful = searches.filter(s => s.results_count > 0).length;

        // Find most common budget range
        const budgetRanges: Array<{ min: number; max: number }> = [];
        searches.forEach(search => {
            if (search.search_criteria.budget_min && search.search_criteria.budget_max) {
                budgetRanges.push({
                    min: search.search_criteria.budget_min,
                    max: search.search_criteria.budget_max,
                });
            }
        });

        const favoriteBudgetRange = budgetRanges.length > 0
            ? {
                min: Math.round(budgetRanges.reduce((sum, range) => sum + range.min, 0) / budgetRanges.length),
                max: Math.round(budgetRanges.reduce((sum, range) => sum + range.max, 0) / budgetRanges.length),
            }
            : null;

        // Find most common bedroom count
        const bedroomCounts: Record<number, number> = {};
        searches.forEach(search => {
            if (search.search_criteria.bedrooms) {
                bedroomCounts[search.search_criteria.bedrooms] =
                    (bedroomCounts[search.search_criteria.bedrooms] || 0) + 1;
            }
        });

        const preferredBedrooms = Object.keys(bedroomCounts).length > 0
            ? parseInt(Object.keys(bedroomCounts).reduce((a, b) =>
                bedroomCounts[parseInt(a)] > bedroomCounts[parseInt(b)] ? a : b
            ))
            : null;

        // Find preferred locations
        const locationCounts: Record<string, number> = {};
        searches.forEach(search => {
            if (search.search_criteria.location_areas) {
                search.search_criteria.location_areas.forEach(location => {
                    locationCounts[location] = (locationCounts[location] || 0) + 1;
                });
            }
        });

        const preferredLocations = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([location]) => location);

        // Find most searched amenities
        const amenityCounts: Record<string, number> = {};
        searches.forEach(search => {
            if (search.search_criteria.required_amenities) {
                search.search_criteria.required_amenities.forEach(amenity => {
                    amenityCounts[amenity] = (amenityCounts[amenity] || 0) + 1;
                });
            }
        });

        const mostSearchedAmenities = Object.entries(amenityCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([amenity]) => amenity);

        // Calculate search frequency
        const searchFrequency = searches.length > 1
            ? Math.round(
                (new Date(searches[0].created_at).getTime() -
                    new Date(searches[searches.length - 1].created_at).getTime()) /
                (1000 * 60 * 60 * 24) / searches.length
            )
            : 0;

        return {
            total_searches: searches.length,
            successful_searches: successful,
            favorite_budget_range: favoriteBudgetRange,
            preferred_bedrooms: preferredBedrooms,
            preferred_locations: preferredLocations,
            most_searched_amenities: mostSearchedAmenities,
            search_frequency_days: searchFrequency,
        };
    }

    // Delete old searches
    async deleteOldSearches(daysOld: number = 180): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.propertySearchRepository.delete({
            created_at: Between(new Date('2000-01-01'), cutoffDate),
        });

        return result.affected || 0;
    }

    // Delete search record
    async delete(id: string): Promise<boolean> {
        const result = await this.propertySearchRepository.delete(id);
        return (result.affected || 0) > 0;
    }
}