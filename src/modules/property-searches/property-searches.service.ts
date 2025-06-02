// File name: src/modules/property-searches/property-searches.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PropertySearchesRepository } from './property-searches.repository';
import {
    PropertySearch,
    SearchSource,
    SearchResultQuality,
    SearchCriteria,
    SearchResults,
    SearchMetadata,
} from './entities/property-search.entity';
import { CreatePropertySearchDto } from './dto/create-property-search.dto';
import { SearchAnalyticsDto } from './dto/search-analytics.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class PropertySearchesService {
    constructor(
        private readonly propertySearchesRepository: PropertySearchesRepository,
    ) { }

    // Create a new property search record
    async createPropertySearch(createPropertySearchDto: CreatePropertySearchDto): Promise<PropertySearch> {
        // Validate search criteria
        this.validateSearchCriteria(createPropertySearchDto.search_criteria);

        // Auto-calculate quality if not provided
        if (!createPropertySearchDto.search_quality && createPropertySearchDto.average_matching_score) {
            createPropertySearchDto.search_quality = this.calculateSearchQuality(
                createPropertySearchDto.average_matching_score
            );
        }

        return await this.propertySearchesRepository.create(createPropertySearchDto);
    }

    // Find property search by ID
    async findById(id: string): Promise<PropertySearch> {
        const search = await this.propertySearchesRepository.findById(id);
        if (!search) {
            throw new NotFoundException(`Property search with ID ${id} not found`);
        }
        return search;
    }

    // Get user search history
    async getUserSearchHistory(userPhone: string, limit: number = 20): Promise<PropertySearch[]> {
        return await this.propertySearchesRepository.findByUserPhone(userPhone, limit);
    }

    // Get recent searches by user
    async getRecentSearchesByUser(userPhone: string, hours: number = 24): Promise<PropertySearch[]> {
        return await this.propertySearchesRepository.findRecentByUser(userPhone, hours);
    }

    // Search with analytics filters
    async searchWithAnalytics(analyticsDto: SearchAnalyticsDto): Promise<PaginatedResponse<PropertySearch>> {
        return await this.propertySearchesRepository.searchWithAnalytics(analyticsDto);
    }

    // Record property view interaction
    async recordPropertyView(searchId: string, propertyId: string): Promise<PropertySearch> {
        const search = await this.propertySearchesRepository.recordPropertyView(searchId, propertyId);
        if (!search) {
            throw new NotFoundException(`Property search with ID ${searchId} not found`);
        }
        return search;
    }

    // Record agent contact interaction
    async recordAgentContact(searchId: string, agentId: string): Promise<PropertySearch> {
        const search = await this.propertySearchesRepository.recordAgentContact(searchId, agentId);
        if (!search) {
            throw new NotFoundException(`Property search with ID ${searchId} not found`);
        }

        // Update search metadata to indicate conversion
        search.search_metadata.resulted_in_contact = true;
        search.search_metadata.agents_contacted = search.search_metadata.agents_contacted || [];

        return search;
    }

    // Record user satisfaction rating
    async recordSatisfactionRating(searchId: string, rating: number): Promise<PropertySearch> {
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        const search = await this.propertySearchesRepository.recordSatisfactionRating(searchId, rating);
        if (!search) {
            throw new NotFoundException(`Property search with ID ${searchId} not found`);
        }
        return search;
    }

    // Find similar searches for recommendations
    async findSimilarSearches(searchId: string, limit: number = 10): Promise<PropertySearch[]> {
        return await this.propertySearchesRepository.findSimilarSearches(searchId, limit);
    }

    // Get comprehensive search analytics
    async getSearchAnalytics(days: number = 30): Promise<any> {
        return await this.propertySearchesRepository.getSearchAnalytics(days);
    }

    // Get user search patterns and preferences
    async getUserSearchPatterns(userPhone: string): Promise<any> {
        return await this.propertySearchesRepository.getUserSearchPatterns(userPhone);
    }

    // Process and analyze search performance
    async analyzeSearchPerformance(searchId: string): Promise<{
        quality_score: number;
        engagement_metrics: any;
        conversion_indicators: any;
        recommendations: string[];
    }> {
        const search = await this.findById(searchId);

        // Calculate quality score
        const qualityScore = this.calculateQualityScore(search);

        // Get engagement metrics
        const engagementMetrics = this.calculateEngagementMetrics(search);

        // Get conversion indicators
        const conversionIndicators = search.conversion_indicators;

        // Generate recommendations
        const recommendations = this.generateSearchRecommendations(search);

        return {
            quality_score: qualityScore,
            engagement_metrics: engagementMetrics,
            conversion_indicators: conversionIndicators,
            recommendations,
        };
    }

    // Bulk analyze searches for insights
    async bulkAnalyzeSearches(searchIds: string[]): Promise<{
        analyzed: number;
        failed: string[];
        insights: any;
    }> {
        const failed: string[] = [];
        let analyzed = 0;
        const allSearches: PropertySearch[] = [];

        for (const searchId of searchIds) {
            try {
                const search = await this.findById(searchId);
                allSearches.push(search);
                analyzed++;
            } catch (error) {
                failed.push(searchId);
            }
        }

        // Generate collective insights
        const insights = this.generateCollectiveInsights(allSearches);

        return {
            analyzed,
            failed,
            insights,
        };
    }

    // Create search from WhatsApp conversation
    async createSearchFromConversation(
        userPhone: string,
        conversationId: string,
        originalQuery: string,
        searchCriteria: SearchCriteria,
        searchResults: SearchResults,
        executionTimeMs?: number
    ): Promise<PropertySearch> {
        const searchMetadata: SearchMetadata = {
            execution_time_ms: executionTimeMs,
            intent_confidence: 0.8, // Default confidence
            nlp_entities_extracted: {},
            properties_viewed: [],
            agents_contacted: [],
            follow_up_searches: 0,
        };

        const createSearchDto: CreatePropertySearchDto = {
            user_phone: userPhone,
            search_criteria: searchCriteria,
            search_results: searchResults,
            search_source: SearchSource.WHATSAPP_CHAT,
            results_count: searchResults.total_found,
            average_matching_score: searchResults.average_score,
            search_metadata: searchMetadata,
            original_query: originalQuery,
            conversation_id: conversationId,
        };

        return await this.createPropertySearch(createSearchDto);
    }

    // Update search with AI insights
    async updateSearchWithAIInsights(
        searchId: string,
        intentConfidence: number,
        extractedEntities: Record<string, any>,
        suggestedRefinements: string[]
    ): Promise<PropertySearch> {
        const search = await this.findById(searchId);

        search.search_metadata = {
            ...search.search_metadata,
            intent_confidence: intentConfidence,
            nlp_entities_extracted: extractedEntities,
            search_refinements_suggested: suggestedRefinements,
        };

        // Update quality assessment
        search.updateSearchQuality();

        return await this.propertySearchesRepository.create(search);
    }

    // Clean up old searches
    async cleanupOldSearches(daysOld: number = 180): Promise<number> {
        return await this.propertySearchesRepository.deleteOldSearches(daysOld);
    }

    // Delete search
    async deleteSearch(searchId: string): Promise<void> {
        const search = await this.findById(searchId);
        const deleted = await this.propertySearchesRepository.delete(searchId);

        if (!deleted) {
            throw new BadRequestException(`Failed to delete search ${searchId}`);
        }
    }

    // Generate search report for admins
    async generateSearchReport(days: number = 30): Promise<{
        summary: any;
        trends: any;
        user_behavior: any;
        conversion_analysis: any;
        recommendations: string[];
    }> {
        const analytics = await this.getSearchAnalytics(days);

        // Generate trend analysis
        const trends = this.analyzeTrends(analytics);

        // Analyze user behavior patterns
        const userBehavior = this.analyzeUserBehavior(analytics);

        // Conversion analysis
        const conversionAnalysis = this.analyzeConversions(analytics);

        // Generate business recommendations
        const recommendations = this.generateBusinessRecommendations(analytics);

        return {
            summary: {
                period_days: days,
                total_searches: analytics.total_searches,
                success_rate: (analytics.successful_searches / analytics.total_searches) * 100,
                average_quality: analytics.average_matching_score,
                generated_at: new Date(),
            },
            trends,
            user_behavior: userBehavior,
            conversion_analysis: conversionAnalysis,
            recommendations,
        };
    }

    // Private helper methods

    private validateSearchCriteria(criteria: SearchCriteria): void {
        if (!criteria) {
            throw new BadRequestException('Search criteria is required');
        }

        // Validate budget range
        if (criteria.budget_min && criteria.budget_max) {
            if (criteria.budget_min >= criteria.budget_max) {
                throw new BadRequestException('Minimum budget must be less than maximum budget');
            }

            if (criteria.budget_min < 0 || criteria.budget_max < 0) {
                throw new BadRequestException('Budget values must be positive');
            }
        }

        // Validate bedrooms/bathrooms
        if (criteria.bedrooms && (criteria.bedrooms < 0 || criteria.bedrooms > 10)) {
            throw new BadRequestException('Bedrooms must be between 0 and 10');
        }

        if (criteria.bathrooms && (criteria.bathrooms < 0 || criteria.bathrooms > 10)) {
            throw new BadRequestException('Bathrooms must be between 0 and 10');
        }
    }

    private calculateSearchQuality(averageScore: number): SearchResultQuality {
        if (averageScore >= 80) return SearchResultQuality.EXCELLENT;
        if (averageScore >= 60) return SearchResultQuality.GOOD;
        if (averageScore >= 40) return SearchResultQuality.FAIR;
        return SearchResultQuality.POOR;
    }

    private calculateQualityScore(search: PropertySearch): number {
        let score = 0;
        let factors = 0;

        // Results quality (40% weight)
        if (search.average_matching_score) {
            score += search.average_matching_score * 0.4;
            factors += 0.4;
        }

        // Results count (20% weight)
        if (search.results_count > 0) {
            const resultScore = Math.min(search.results_count / 10, 1) * 100;
            score += resultScore * 0.2;
            factors += 0.2;
        }

        // User engagement (30% weight)
        const viewedCount = search.search_metadata.properties_viewed?.length || 0;
        const contactedCount = search.search_metadata.agents_contacted?.length || 0;
        const engagementScore = Math.min((viewedCount * 20) + (contactedCount * 40), 100);
        score += engagementScore * 0.3;
        factors += 0.3;

        // User satisfaction (10% weight)
        if (search.search_metadata.user_satisfaction) {
            const satisfactionScore = (search.search_metadata.user_satisfaction / 5) * 100;
            score += satisfactionScore * 0.1;
            factors += 0.1;
        }

        return factors > 0 ? Math.round(score / factors) : 0;
    }

    private calculateEngagementMetrics(search: PropertySearch): any {
        return {
            properties_viewed: search.search_metadata.properties_viewed?.length || 0,
            agents_contacted: search.search_metadata.agents_contacted?.length || 0,
            time_spent_minutes: search.search_metadata.execution_time_ms ?
                Math.round(search.search_metadata.execution_time_ms / 60000) : 0,
            follow_up_searches: search.search_metadata.follow_up_searches || 0,
            satisfaction_rating: search.search_metadata.user_satisfaction || null,
        };
    }

    private generateSearchRecommendations(search: PropertySearch): string[] {
        const recommendations: string[] = [];

        // Low results recommendations
        if (search.results_count < 3) {
            recommendations.push('Consider broadening search criteria to increase available options');

            if (search.search_criteria.budget_max && search.search_criteria.budget_min) {
                const range = search.search_criteria.budget_max - search.search_criteria.budget_min;
                if (range < 200000) {
                    recommendations.push('Increase budget range for more property options');
                }
            }
        }

        // Low engagement recommendations
        const viewedCount = search.search_metadata.properties_viewed?.length || 0;
        if (search.results_count > 5 && viewedCount < 2) {
            recommendations.push('Property matching may need improvement - results not engaging user');
        }

        // Quality improvement recommendations
        if (search.average_matching_score && search.average_matching_score < 60) {
            recommendations.push('Improve matching algorithm for this search pattern');
        }

        return recommendations;
    }

    private generateCollectiveInsights(searches: PropertySearch[]): any {
        const totalSearches = searches.length;
        if (totalSearches === 0) return {};

        // Calculate averages
        const avgResults = searches.reduce((sum, s) => sum + s.results_count, 0) / totalSearches;
        const avgScore = searches.reduce((sum, s) => sum + (s.average_matching_score || 0), 0) / totalSearches;

        // Most common criteria
        const budgetRanges: number[] = [];
        const bedroomCounts: number[] = [];
        const locations: string[] = [];

        searches.forEach(search => {
            if (search.search_criteria.budget_max) {
                budgetRanges.push(search.search_criteria.budget_max);
            }
            if (search.search_criteria.bedrooms) {
                bedroomCounts.push(search.search_criteria.bedrooms);
            }
            if (search.search_criteria.location_areas) {
                locations.push(...search.search_criteria.location_areas);
            }
        });

        return {
            total_analyzed: totalSearches,
            average_results_per_search: Math.round(avgResults),
            average_matching_score: Math.round(avgScore),
            most_common_budget_max: this.getMostCommon(budgetRanges),
            most_common_bedrooms: this.getMostCommon(bedroomCounts),
            most_popular_locations: this.getTopItems(locations, 5),
            quality_distribution: this.getQualityDistribution(searches),
        };
    }

    private analyzeTrends(analytics: any): any {
        return {
            search_volume_trend: analytics.total_searches > 100 ? 'high' : 'moderate',
            quality_trend: analytics.average_matching_score > 70 ? 'improving' : 'needs_attention',
            popular_price_ranges: analytics.top_search_criteria.budget_ranges,
            emerging_locations: analytics.top_search_criteria.popular_locations.slice(0, 3),
        };
    }

    private analyzeUserBehavior(analytics: any): any {
        return {
            engagement_rate: analytics.conversion_metrics.properties_viewed_rate,
            contact_rate: analytics.conversion_metrics.agents_contacted_rate,
            search_refinement_rate: analytics.conversion_metrics.follow_up_searches_rate,
            preferred_search_sources: Object.entries(analytics.by_source)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 3),
        };
    }

    private analyzeConversions(analytics: any): any {
        const totalSearches = analytics.total_searches;
        return {
            search_to_view_rate: analytics.conversion_metrics.properties_viewed_rate,
            search_to_contact_rate: analytics.conversion_metrics.agents_contacted_rate,
            view_to_contact_rate: totalSearches > 0 ?
                (analytics.conversion_metrics.agents_contacted_rate / analytics.conversion_metrics.properties_viewed_rate) * 100 : 0,
            quality_impact_on_conversion: analytics.average_matching_score > 70 ? 'positive' : 'negative',
        };
    }

    private generateBusinessRecommendations(analytics: any): string[] {
        const recommendations: string[] = [];

        if (analytics.average_matching_score < 60) {
            recommendations.push('Improve property matching algorithm accuracy');
        }

        if (analytics.conversion_metrics.properties_viewed_rate < 30) {
            recommendations.push('Enhance property presentation and descriptions');
        }

        if (analytics.conversion_metrics.agents_contacted_rate < 15) {
            recommendations.push('Streamline agent contact process for users');
        }

        if (analytics.successful_searches / analytics.total_searches < 0.8) {
            recommendations.push('Increase property inventory in popular search areas');
        }

        return recommendations;
    }

    private getMostCommon<T>(items: T[]): T | null {
        if (items.length === 0) return null;

        const counts = items.reduce((acc, item) => {
            acc[item as any] = (acc[item as any] || 0) + 1;
            return acc;
        }, {} as Record<any, number>);

        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)[0][0] as T;
    }

    private getTopItems<T>(items: T[], limit: number): Array<{ item: T, count: number }> {
        const counts = items.reduce((acc, item) => {
            acc[item as any] = (acc[item as any] || 0) + 1;
            return acc;
        }, {} as Record<any, number>);

        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([item, count]) => ({ item: item as T, count }));
    }

    private getQualityDistribution(searches: PropertySearch[]): any {
        const distribution = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
        };

        searches.forEach(search => {
            if (search.search_quality) {
                distribution[search.search_quality]++;
            }
        });

        return distribution;
    }
}