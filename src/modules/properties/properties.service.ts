// File name: src/Modules/properties/properties.service.ts

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, FindOptionsWhere } from 'typeorm';
import { Property, PropertyStatus, PropertyVerificationStatus, PropertyType, PropertyAmenities } from './entities/property.entity';
import { Agent, AgentStatus } from '../agents/entities/agent.entity';
import { User } from '../users/entities/user.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertySearchDto } from './dto/property-search.dto';
import { PropertyMatchDto } from './dto/property-match.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';
import { PropertyMatchingService } from '../../services/property-matching.service';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private readonly propertyRepository: Repository<Property>,
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly propertyMatchingService: PropertyMatchingService,
    ) { }

    // Create new property listing
    async createProperty(agentId: string, createPropertyDto: CreatePropertyDto): Promise<Property> {
        // Verify agent exists and is active
        const agent = await this.agentRepository.findOne({
            where: { id: agentId, status: AgentStatus.ACTIVE }
        });

        if (!agent) {
            throw new NotFoundException('Agent not found or inactive');
        }

        // Check agent subscription limits
        const agentPropertiesCount = await this.propertyRepository.count({
            where: { agent_id: agentId, status: In([PropertyStatus.AVAILABLE, PropertyStatus.RENTED]) }
        });

        const maxProperties = agent.subscription_tier === 'premium' ? 100 : 5;
        if (agentPropertiesCount >= maxProperties) {
            throw new BadRequestException(`Agent has reached maximum property limit (${maxProperties})`);
        }

        // Convert amenities array to PropertyAmenities object
        const amenitiesObject: PropertyAmenities = {};
        if (createPropertyDto.amenities && Array.isArray(createPropertyDto.amenities)) {
            createPropertyDto.amenities.forEach(amenity => {
                amenitiesObject[amenity] = true;
            });
        }

        // Create property
        const property = this.propertyRepository.create({
            title: createPropertyDto.title,
            description: createPropertyDto.description,
            property_type: createPropertyDto.property_type,
            price: createPropertyDto.price,
            bedrooms: createPropertyDto.bedrooms,
            bathrooms: createPropertyDto.bathrooms,
            amenities: amenitiesObject,
            agent_id: agentId,
            location: {
                ...createPropertyDto.location,
                coordinates: await this.getCoordinates(createPropertyDto.location.address || createPropertyDto.location.area)
            },
            verification_status: PropertyVerificationStatus.PENDING,
            status: PropertyStatus.AVAILABLE,
            is_available: true,
            inquiry_count: 0,
            view_count: 0,
            images: []
        });

        return await this.propertyRepository.save(property);
    }

    // Get property by ID with view count increment
    async findPropertyById(id: string, incrementView = true): Promise<Property> {
        const property = await this.propertyRepository.findOne({
            where: { id },
            relations: ['agent']
        });

        if (!property) {
            throw new NotFoundException('Property not found');
        }

        // Increment view count
        if (incrementView) {
            await this.propertyRepository.increment({ id }, 'view_count', 1);
            property.view_count += 1;
        }

        return property;
    }

    // Update property
    async updateProperty(id: string, agentId: string, updatePropertyDto: UpdatePropertyDto): Promise<Property> {
        const property = await this.findPropertyById(id, false);

        // Check if agent owns this property
        if (property.agent_id !== agentId) {
            throw new ForbiddenException('You can only update your own properties');
        }

        // Update location coordinates if address changed
        if (updatePropertyDto.location?.address) {
            updatePropertyDto.location.coordinates = await this.getCoordinates(
                updatePropertyDto.location.address
            );
        }

        // Convert amenities array to object if provided
        if (updatePropertyDto.amenities && Array.isArray(updatePropertyDto.amenities)) {
            const amenitiesObject: PropertyAmenities = {};
            updatePropertyDto.amenities.forEach(amenity => {
                amenitiesObject[amenity] = true;
            });
            updatePropertyDto.amenities = Object.keys(amenitiesObject);
        }

        Object.assign(property, updatePropertyDto);
        return await this.propertyRepository.save(property);
    }

    // Delete property
    async deleteProperty(id: string, agentId: string): Promise<void> {
        const property = await this.findPropertyById(id, false);

        if (property.agent_id !== agentId) {
            throw new ForbiddenException('You can only delete your own properties');
        }

        await this.propertyRepository.remove(property);
    }

    // Advanced property search
    async searchProperties(searchDto: PropertySearchDto): Promise<PaginatedResponse<Property>> {
        const {
            page = 1,
            limit = 10,
            location,
            price_min: minPrice,
            price_max: maxPrice,
            bedrooms,
            bathrooms,
            property_type: propertyType,
            amenities,
            radius = 10,
            sort_by: sortBy = 'created_at',
            sort_order: sortOrder = 'DESC'
        } = searchDto;

        const query = this.propertyRepository.createQueryBuilder('property')
            .leftJoinAndSelect('property.agent', 'agent')
            .where('property.status = :status', { status: PropertyStatus.AVAILABLE })
            .andWhere('property.is_available = :isAvailable', { isAvailable: true })
            .andWhere('property.verification_status = :verificationStatus', { verificationStatus: PropertyVerificationStatus.VERIFIED });

        // Location-based search
        if (location) {
            if (typeof location === 'string') {
                // Simple string search
                query.andWhere("property.location->>'area' ILIKE :area", { area: `%${location}%` });
            } else if (location && typeof location === 'object') {
                // Object location search
                const locationObj = location as any;
                if (locationObj.coordinates) {
                    // Search within radius using coordinates
                    const radius = searchDto.radius || 10;
                    query.andWhere(`
                        ST_DWithin(
                            ST_GeogFromText('POINT(' || (property.location->>'longitude')::float || ' ' || (property.location->>'latitude')::float || ')'),
                            ST_GeogFromText('POINT(' || :longitude || ' ' || :latitude || ')'),
                            :radius
                        )
                    `, {
                        longitude: locationObj.coordinates.longitude,
                        latitude: locationObj.coordinates.latitude,
                        radius: radius * 1000 // Convert km to meters
                    });
                } else if (locationObj.area) {
                    // Search by area name
                    query.andWhere("property.location->>'area' ILIKE :area", { area: `%${locationObj.area}%` });
                }
            }
        }


        // Price range filter
        if (minPrice) {
            query.andWhere('property.price >= :minPrice', { minPrice });
        }
        if (maxPrice) {
            query.andWhere('property.price <= :maxPrice', { maxPrice });
        }

        // Bedrooms filter
        if (bedrooms) {
            query.andWhere('property.bedrooms >= :bedrooms', { bedrooms });
        }

        // Bathrooms filter
        if (bathrooms) {
            query.andWhere('property.bathrooms >= :bathrooms', { bathrooms });
        }

        // Property type filter
        if (propertyType) {
            query.andWhere('property.property_type = :propertyType', { propertyType });
        }

        // Amenities filter - check if amenities object contains the required amenities
        if (amenities && amenities.length > 0) {
            amenities.forEach((amenity, index) => {
                query.andWhere(`property.amenities->>:amenity${index} = 'true'`, { [`amenity${index}`]: amenity });
            });
        }

        // Sorting
        const validSortFields = ['created_at', 'price', 'bedrooms', 'view_count', 'inquiry_count'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        query.orderBy(`property.${sortField}`, sortOrder as 'ASC' | 'DESC');

        // Pagination
        const offset = (page - 1) * limit;
        query.skip(offset).take(limit);

        const [properties, total] = await query.getManyAndCount();

        return {
            data: properties,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        };
    }

    // AI-Powered property matching for WhatsApp users
    async matchPropertiesForUser(userPhone: string): Promise<Property[]> {
        // Get user preferences
        const user = await this.userRepository.findOne({
            where: { phone_number: userPhone }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get available properties
        const properties = await this.propertyRepository.find({
            where: {
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                verification_status: PropertyVerificationStatus.VERIFIED
            },
            relations: ['agent'],
            take: 50 // Limit for performance
        });

        // TODO: Check if the AI is activated here and functions properly
        // Use AI matching service to score and rank properties
        const matchedProperties = await this.propertyMatchingService.matchProperties(user, properties);

        return matchedProperties.slice(0, 10); // Return top 10 matches
    }

    // Get properties by agent
    async getAgentProperties(agentId: string, filterDto?: PropertyFilterDto): Promise<Property[]> {
        const whereCondition: FindOptionsWhere<Property> = { agent_id: agentId };

        if (filterDto?.status) {
            whereCondition.status = filterDto.status as PropertyStatus;
        }

        if (filterDto?.verificationStatus) {
            whereCondition.verification_status = filterDto.verificationStatus as PropertyVerificationStatus;
        }

        return await this.propertyRepository.find({
            where: whereCondition,
            order: { created_at: 'DESC' }
        });
    }

    // Find similar properties
    async findSimilarProperties(propertyId: string): Promise<Property[]> {
        const baseProperty = await this.findPropertyById(propertyId, false);

        const similarProperties = await this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.agent', 'agent')
            .where('property.id != :id', { id: propertyId })
            .andWhere('property.status = :status', { status: PropertyStatus.AVAILABLE })
            .andWhere('property.property_type = :propertyType', { propertyType: baseProperty.property_type })
            .andWhere('property.bedrooms = :bedrooms', { bedrooms: baseProperty.bedrooms })
            .andWhere('property.price BETWEEN :minPrice AND :maxPrice', {
                minPrice: Number(baseProperty.price) * 0.8,
                maxPrice: Number(baseProperty.price) * 1.2
            })
            .andWhere("property.location->>'area' = :area", { area: baseProperty.location.area })
            .orderBy('property.view_count', 'DESC')
            .limit(5)
            .getMany();

        return similarProperties;
    }

    // Update property status
    async updatePropertyStatus(id: string, agentId: string, status: string): Promise<Property> {
        const property = await this.findPropertyById(id, false);

        if (property.agent_id !== agentId) {
            throw new ForbiddenException('You can only update your own properties');
        }

        property.status = status as PropertyStatus;
        property.is_available = status === PropertyStatus.AVAILABLE;

        if (status === PropertyStatus.RENTED) {
            property.rented_at = new Date();
        }

        return await this.propertyRepository.save(property);
    }

    // Upload property images
    async uploadPropertyImages(propertyId: string, agentId: string, imageUrls: string[]): Promise<Property> {
        const property = await this.findPropertyById(propertyId, false);

        if (property.agent_id !== agentId) {
            throw new ForbiddenException('You can only update your own properties');
        }

        property.images = [...property.images, ...imageUrls];
        return await this.propertyRepository.save(property);
    }

    // Get property analytics
    async getPropertyAnalytics(): Promise<any> {
        const totalProperties = await this.propertyRepository.count();
        const availableProperties = await this.propertyRepository.count({
            where: { status: PropertyStatus.AVAILABLE }
        });
        const rentedProperties = await this.propertyRepository.count({
            where: { status: PropertyStatus.RENTED }
        });

        const propertyTypeDistribution = await this.propertyRepository
            .createQueryBuilder('property')
            .select('property.property_type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('property.property_type')
            .getRawMany();

        const averagePriceByBedrooms = await this.propertyRepository
            .createQueryBuilder('property')
            .select('property.bedrooms', 'bedrooms')
            .addSelect('AVG(property.price)', 'averagePrice')
            .where('property.status = :status', { status: PropertyStatus.AVAILABLE })
            .groupBy('property.bedrooms')
            .orderBy('property.bedrooms', 'ASC')
            .getRawMany();

        const popularAreas = await this.propertyRepository
            .createQueryBuilder('property')
            .select("property.location->>'area'", 'area')
            .addSelect('COUNT(*)', 'count')
            .addSelect('AVG(property.price)', 'averagePrice')
            .where('property.status = :status', { status: PropertyStatus.AVAILABLE })
            .groupBy("property.location->>'area'")
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany();

        const recentActivity = {
            thisMonth: await this.getPropertiesThisMonth(),
            lastMonth: await this.getPropertiesLastMonth()
        };

        return {
            totalProperties,
            availableProperties,
            rentedProperties,
            occupancyRate: totalProperties > 0 ? ((rentedProperties / totalProperties) * 100).toFixed(2) : 0,
            propertyTypeDistribution,
            averagePriceByBedrooms: averagePriceByBedrooms.map(item => ({
                bedrooms: parseInt(item.bedrooms),
                averagePrice: parseFloat(item.averagePrice)
            })),
            popularAreas: popularAreas.map(item => ({
                area: item.area,
                count: parseInt(item.count),
                averagePrice: parseFloat(item.averagePrice)
            })),
            recentActivity
        };
    }

    // Increment inquiry count
    async incrementInquiryCount(propertyId: string): Promise<void> {
        await this.propertyRepository.increment({ id: propertyId }, 'inquiry_count', 1);
    }

    // Get all properties (Admin)
    async findAllProperties(page = 1, limit = 10): Promise<PaginatedResponse<Property>> {
        const [properties, total] = await this.propertyRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { created_at: 'DESC' },
            relations: ['agent']
        });

        return {
            data: properties,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        };
    }

    // Private helper methods
    private async getCoordinates(address: string): Promise<{ latitude: number; longitude: number }> {
        // Mock implementation - in production, use Google Maps API or similar
        const mockCoordinates = {
            'Lugbe': { latitude: 8.7594, longitude: 7.3831 },
            'Kuje': { latitude: 8.8667, longitude: 7.2167 },
            'Gwagwalada': { latitude: 8.9475, longitude: 7.0833 }
        };

        const area = Object.keys(mockCoordinates).find(key =>
            address.toLowerCase().includes(key.toLowerCase())
        );

        return area ? mockCoordinates[area] : { latitude: 8.7594, longitude: 7.3831 };
    }

    private async getPropertiesThisMonth(): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        return await this.propertyRepository.count({
            where: {
                created_at: Between(startOfMonth, new Date())
            }
        });
    }

    private async getPropertiesLastMonth(): Promise<number> {
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);

        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);

        return await this.propertyRepository.count({
            where: {
                created_at: Between(startOfLastMonth, endOfLastMonth)
            }
        });
    }

    // Find properties by agent ID (for agent dashboard)
    async findByAgentId(agentId: string): Promise<Property[]> {
        return await this.propertyRepository.find({
            where: {
                agent_id: agentId
            },
            order: { created_at: 'DESC' },
        });
    }

    // Find properties by agent with pagination and filters
    async findByAgent(
        agentId: string,
        filterDto: any
    ): Promise<PaginatedResponse<Property>> {
        const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC' } = filterDto;

        const queryBuilder = this.propertyRepository.createQueryBuilder('property')
            .where('property.agent_id = :agentId', { agentId });

        // Add sorting
        queryBuilder.orderBy(`property.${sort_by}`, sort_order as 'ASC' | 'DESC');

        // Add pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

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
}