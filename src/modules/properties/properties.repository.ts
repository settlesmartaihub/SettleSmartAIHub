// Filename: src/modules/properties/properties.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between, In } from 'typeorm';
import {
    Property,
    PropertyType,
    PropertyVerificationStatus,
    PropertyStatus,
    PropertyAmenities,
} from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertySearchDto, PropertyMatchDto } from './dto/property-search.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

export interface PropertyMatchResult {
    property: Property;
    matching_score: number;
}

@Injectable()
export class PropertiesRepository {
    constructor(
        @InjectRepository(Property)
        private readonly propertyRepository: Repository<Property>,
    ) { }

    /**
     * Create a new property
     */
    async create(
        agentId: string,
        createPropertyDto: CreatePropertyDto,
    ): Promise<Property> {
        const property = this.propertyRepository.create({
            ...createPropertyDto,
            agent_id: agentId,
            // Set defaults
            verification_status: PropertyVerificationStatus.PENDING,
            status: PropertyStatus.AVAILABLE,
            is_available: true,
            inquiry_count: 0,
            view_count: 0,
            images: createPropertyDto.images || [],
        });

        return await this.propertyRepository.save(property);
    }

    /**
     * Find property by ID
     */
    async findById(id: string): Promise<Property | null> {
        return await this.propertyRepository.findOne({
            where: { id },
            relations: ['agent'],
        });
    }

    /**
     * Update property
     */
    async update(id: string, updatePropertyDto: UpdatePropertyDto): Promise<Property | null> {
        await this.propertyRepository.update(id, updatePropertyDto);
        return await this.findById(id);
    }

    /**
     * Delete property
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.propertyRepository.delete(id);
        return (result.affected || 0) > 0;
    }

    /**
     * Search properties with pagination and filters
     */
    async search(searchDto: PropertySearchDto): Promise<PaginatedResponse<Property>> {
        const {
            search,
            property_type,
            price_min,
            price_max,
            location,
            bedrooms,
            bathrooms,
            amenities,
            verification_status,
            status,
            is_available,
            agent_id,
            sort_by = 'created_at',
            sort_order = 'DESC',
            page = 1,
            limit = 10,
        } = searchDto;

        const queryBuilder = this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.agent', 'agent');

        // Apply filters
        if (search) {
            queryBuilder.andWhere(
                '(property.title ILIKE :search OR property.description ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (property_type) {
            queryBuilder.andWhere('property.property_type = :property_type', { property_type });
        }

        if (price_min !== undefined) {
            queryBuilder.andWhere('property.price >= :price_min', { price_min });
        }

        if (price_max !== undefined) {
            queryBuilder.andWhere('property.price <= :price_max', { price_max });
        }

        if (location) {
            queryBuilder.andWhere("property.location->>'area' ILIKE :location", {
                location: `%${location}%`,
            });
        }

        if (bedrooms !== undefined) {
            queryBuilder.andWhere('property.bedrooms = :bedrooms', { bedrooms });
        }

        if (bathrooms !== undefined) {
            queryBuilder.andWhere('property.bathrooms = :bathrooms', { bathrooms });
        }

        if (amenities && amenities.length > 0) {
            // Check if all required amenities are available
            for (const amenity of amenities) {
                queryBuilder.andWhere(`property.amenities->>'${amenity}' = 'true'`);
            }
        }

        if (verification_status) {
            queryBuilder.andWhere('property.verification_status = :verification_status', {
                verification_status,
            });
        }

        if (status) {
            queryBuilder.andWhere('property.status = :status', { status });
        }

        if (is_available !== undefined) {
            queryBuilder.andWhere('property.is_available = :is_available', { is_available });
        }

        if (agent_id) {
            queryBuilder.andWhere('property.agent_id = :agent_id', { agent_id });
        }

        // Add pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        // Add ordering
        const sortField = `property.${sort_by}`;
        queryBuilder.orderBy(sortField, sort_order);

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

    /**
     * Find available properties for rent
     */
    async findAvailableProperties(limit: number = 20): Promise<Property[]> {
        return await this.propertyRepository.find({
            where: {
                is_available: true,
                status: PropertyStatus.AVAILABLE,
                verification_status: PropertyVerificationStatus.VERIFIED,
            },
            relations: ['agent'],
            order: { created_at: 'DESC' },
            take: limit,
        });
    }

    /**
     * Find properties by agent
     */
    async findByAgent(agentId: string): Promise<Property[]> {
        return await this.propertyRepository.find({
            where: { agent_id: agentId },
            relations: ['agent'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find properties by location
     */
    async findByLocation(location: string, limit: number = 20): Promise<Property[]> {
        return await this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.agent', 'agent')
            .where("property.location->>'area' ILIKE :location", {
                location: `%${location}%`,
            })
            .andWhere('property.is_available = :available', { available: true })
            .andWhere('property.verification_status = :verified', {
                verified: PropertyVerificationStatus.VERIFIED,
            })
            .orderBy('property.created_at', 'DESC')
            .take(limit)
            .getMany();
    }

    /**
     * Find properties by price range
     */
    async findByPriceRange(minPrice: number, maxPrice: number): Promise<Property[]> {
        return await this.propertyRepository.find({
            where: {
                price: Between(minPrice, maxPrice),
                is_available: true,
                verification_status: PropertyVerificationStatus.VERIFIED,
            },
            relations: ['agent'],
            order: { price: 'ASC' },
        });
    }

    /**
     * Smart property matching based on user preferences
     */
    async findMatchingProperties(matchDto: PropertyMatchDto): Promise<PropertyMatchResult[]> {
        const {
            budget_min,
            budget_max,
            bedrooms,
            property_types,
            required_amenities,
            location,
            min_score = 50,
            limit = 10,
        } = matchDto;

        const queryBuilder = this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.agent', 'agent')
            .where('property.is_available = :available', { available: true })
            .andWhere('property.verification_status = :verified', {
                verified: PropertyVerificationStatus.VERIFIED,
            });

        // Apply filters
        if (budget_min && budget_max) {
            queryBuilder.andWhere('property.price BETWEEN :budget_min AND :budget_max', {
                budget_min,
                budget_max,
            });
        }

        if (bedrooms) {
            queryBuilder.andWhere(
                '(property.bedrooms = :bedrooms OR property.bedrooms = :bedrooms_plus)',
                {
                    bedrooms,
                    bedrooms_plus: bedrooms + 1, // Include one bedroom more as option
                },
            );
        }

        if (property_types && property_types.length > 0) {
            queryBuilder.andWhere('property.property_type IN (:...property_types)', {
                property_types,
            });
        }

        if (required_amenities && required_amenities.length > 0) {
            for (const amenity of required_amenities) {
                queryBuilder.andWhere(`property.amenities->>'${amenity}' = 'true'`);
            }
        }

        if (location) {
            queryBuilder.andWhere("property.location->>'area' ILIKE :location", {
                location: `%${location}%`,
            });
        }

        // Get properties
        const properties = await queryBuilder
            .orderBy('property.created_at', 'DESC')
            .take(limit * 2) // Get more to filter by score
            .getMany();

        // Calculate matching scores
        const propertiesWithScores: PropertyMatchResult[] = properties
            .map((property) => {
                const score = property.calculateMatchingScore({
                    budgetMin: budget_min,
                    budgetMax: budget_max,
                    bedrooms,
                    propertyTypes: property_types,
                    requiredAmenities: required_amenities,
                });

                return {
                    property,
                    matching_score: score,
                };
            })
            .filter((result) => result.matching_score >= min_score)
            .sort((a, b) => b.matching_score - a.matching_score)
            .slice(0, limit);

        return propertiesWithScores;
    }

    /**
     * Update property verification status
     */
    async updateVerificationStatus(
        id: string,
        status: PropertyVerificationStatus,
    ): Promise<Property | null> {
        await this.propertyRepository.update(id, {
            verification_status: status,
        });
        return await this.findById(id);
    }

    /**
     * Update property status (available, rented, etc.)
     */
    async updatePropertyStatus(
        id: string,
        status: PropertyStatus,
        isAvailable?: boolean,
    ): Promise<Property | null> {
        const updateData: any = { status };

        if (isAvailable !== undefined) {
            updateData.is_available = isAvailable;
        }

        if (status === PropertyStatus.RENTED) {
            updateData.rented_at = new Date();
            updateData.is_available = false;
        }

        await this.propertyRepository.update(id, updateData);
        return await this.findById(id);
    }

    /**
     * Increment inquiry count
     */
    async incrementInquiryCount(id: string): Promise<void> {
        await this.propertyRepository
            .createQueryBuilder()
            .update(Property)
            .set({
                inquiry_count: () => 'inquiry_count + 1',
            })
            .where('id = :id', { id })
            .execute();
    }

    /**
     * Increment view count
     */
    async incrementViewCount(id: string): Promise<void> {
        await this.propertyRepository
            .createQueryBuilder()
            .update(Property)
            .set({
                view_count: () => 'view_count + 1',
            })
            .where('id = :id', { id })
            .execute();
    }

    /**
     * Add image to property
     */
    async addImage(id: string, imageUrl: string): Promise<Property | null> {
        const property = await this.findById(id);
        if (!property) return null;

        const updatedImages = [...(property.images || []), imageUrl];
        await this.propertyRepository.update(id, { images: updatedImages });

        return await this.findById(id);
    }

    /**
     * Remove image from property
     */
    async removeImage(id: string, imageUrl: string): Promise<Property | null> {
        const property = await this.findById(id);
        if (!property) return null;

        const updatedImages = (property.images || []).filter(url => url !== imageUrl);
        await this.propertyRepository.update(id, { images: updatedImages });

        return await this.findById(id);
    }

    /**
     * Get property statistics
     */
    async getPropertyStats(): Promise<{
        total: number;
        available: number;
        rented: number;
        verified: number;
        pending: number;
        by_type: Record<PropertyType, number>;
        average_price: number;
    }> {
        const [
            total,
            available,
            rented,
            verified,
            pending,
            averagePrice,
        ] = await Promise.all([
            this.propertyRepository.count(),
            this.propertyRepository.count({
                where: { status: PropertyStatus.AVAILABLE, is_available: true },
            }),
            this.propertyRepository.count({
                where: { status: PropertyStatus.RENTED },
            }),
            this.propertyRepository.count({
                where: { verification_status: PropertyVerificationStatus.VERIFIED },
            }),
            this.propertyRepository.count({
                where: { verification_status: PropertyVerificationStatus.PENDING },
            }),
            this.propertyRepository
                .createQueryBuilder('property')
                .select('AVG(property.price)', 'average')
                .where('property.is_available = :available', { available: true })
                .getRawOne(),
        ]);

        // Get counts by property type
        const typeStats = await this.propertyRepository
            .createQueryBuilder('property')
            .select('property.property_type', 'type')
            .addSelect('COUNT(*)', 'count')
            .where('property.is_available = :available', { available: true })
            .groupBy('property.property_type')
            .getRawMany();

        const byType = Object.values(PropertyType).reduce((acc, type) => {
            acc[type] = 0;
            return acc;
        }, {} as Record<PropertyType, number>);

        typeStats.forEach(({ type, count }) => {
            byType[type] = parseInt(count, 10);
        });

        return {
            total,
            available,
            rented,
            verified,
            pending,
            by_type: byType,
            average_price: Math.round(parseFloat(averagePrice?.average) || 0),
        };
    }

    /**
     * Find properties pending verification
     */
    async findPendingVerification(): Promise<Property[]> {
        return await this.propertyRepository.find({
            where: {
                verification_status: PropertyVerificationStatus.PENDING,
            },
            relations: ['agent'],
            order: { created_at: 'ASC' }, // Oldest first
        });
    }

    /**
     * Find popular properties (high inquiry count)
     */
    async findPopularProperties(limit: number = 10): Promise<Property[]> {
        return await this.propertyRepository.find({
            where: {
                is_available: true,
                verification_status: PropertyVerificationStatus.VERIFIED,
            },
            relations: ['agent'],
            order: {
                inquiry_count: 'DESC',
                view_count: 'DESC',
                created_at: 'DESC',
            },
            take: limit,
        });
    }

    /**
     * Find recent properties (last 7 days)
     */
    async findRecentProperties(days: number = 7): Promise<Property[]> {
        const date = new Date();
        date.setDate(date.getDate() - days);

        return await this.propertyRepository.find({
            where: {
                created_at: Between(date, new Date()),
                is_available: true,
                verification_status: PropertyVerificationStatus.VERIFIED,
            },
            relations: ['agent'],
            order: { created_at: 'DESC' },
            take: 50,
        });
    }

    /**
     * Bulk update property status
     */
    async bulkUpdateStatus(
        propertyIds: string[],
        status: PropertyStatus,
    ): Promise<number> {
        const result = await this.propertyRepository.update(propertyIds, { status });
        return result.affected || 0;
    }

    /**
     * Check agent listing limits
     */
    async checkAgentListingLimit(agentId: string, maxListings: number): Promise<{
        current_count: number;
        can_add_more: boolean;
        remaining: number;
    }> {
        const currentCount = await this.propertyRepository.count({
            where: { agent_id: agentId },
        });

        return {
            current_count: currentCount,
            can_add_more: currentCount < maxListings,
            remaining: Math.max(0, maxListings - currentCount),
        };
    }

    /**
     * Find similar properties for recommendations
     */
    async findSimilarProperties(
        propertyId: string,
        limit: number = 5,
    ): Promise<Property[]> {
        const baseProperty = await this.findById(propertyId);
        if (!baseProperty) return [];

        const priceRange = baseProperty.price * 0.2; // 20% price range

        return await this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.agent', 'agent')
            .where('property.id != :propertyId', { propertyId })
            .andWhere('property.is_available = :available', { available: true })
            .andWhere('property.verification_status = :verified', {
                verified: PropertyVerificationStatus.VERIFIED,
            })
            .andWhere('property.property_type = :type', { type: baseProperty.property_type })
            .andWhere('property.bedrooms = :bedrooms', { bedrooms: baseProperty.bedrooms })
            .andWhere('property.price BETWEEN :minPrice AND :maxPrice', {
                minPrice: baseProperty.price - priceRange,
                maxPrice: baseProperty.price + priceRange,
            })
            .andWhere("property.location->>'area' ILIKE :location", {
                location: `%${baseProperty.location.area}%`,
            })
            .orderBy('property.created_at', 'DESC')
            .take(limit)
            .getMany();
    }

    /**
     * Get properties by bedrooms distribution
     */
    async getBedroomDistribution(): Promise<Record<number, number>> {
        const results = await this.propertyRepository
            .createQueryBuilder('property')
            .select('property.bedrooms', 'bedrooms')
            .addSelect('COUNT(*)', 'count')
            .where('property.is_available = :available', { available: true })
            .andWhere('property.verification_status = :verified', {
                verified: PropertyVerificationStatus.VERIFIED,
            })
            .groupBy('property.bedrooms')
            .orderBy('property.bedrooms', 'ASC')
            .getRawMany();

        const distribution: Record<number, number> = {};
        results.forEach(({ bedrooms, count }) => {
            distribution[parseInt(bedrooms, 10)] = parseInt(count, 10);
        });

        return distribution;
    }

    /**
     * Get price statistics by location
     */
    async getPriceStatsByLocation(): Promise<Array<{
        location: string;
        count: number;
        avg_price: number;
        min_price: number;
        max_price: number;
    }>> {
        return await this.propertyRepository
            .createQueryBuilder('property')
            .select("property.location->>'area'", 'location')
            .addSelect('COUNT(*)', 'count')
            .addSelect('AVG(property.price)', 'avg_price')
            .addSelect('MIN(property.price)', 'min_price')
            .addSelect('MAX(property.price)', 'max_price')
            .where('property.is_available = :available', { available: true })
            .andWhere('property.verification_status = :verified', {
                verified: PropertyVerificationStatus.VERIFIED,
            })
            .groupBy("property.location->>'area'")
            .orderBy('count', 'DESC')
            .getRawMany()
            .then(results =>
                results.map(result => ({
                    location: result.location,
                    count: parseInt(result.count, 10),
                    avg_price: Math.round(parseFloat(result.avg_price)),
                    min_price: parseFloat(result.min_price),
                    max_price: parseFloat(result.max_price),
                }))
            );
    }

    /**
     * Search properties with fuzzy location matching
     */
    async fuzzyLocationSearch(
        searchTerm: string,
        limit: number = 20,
    ): Promise<Property[]> {
        return await this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.agent', 'agent')
            .where('property.is_available = :available', { available: true })
            .andWhere('property.verification_status = :verified', {
                verified: PropertyVerificationStatus.VERIFIED,
            })
            .andWhere(
                `(
          property.location->>'area' ILIKE :search OR 
          property.location->>'landmark' ILIKE :search OR
          property.title ILIKE :search
        )`,
                { search: `%${searchTerm}%` },
            )
            .orderBy('property.created_at', 'DESC')
            .take(limit)
            .getMany();
    }
}