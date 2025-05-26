// Filename: src/database/seeds/001-create-sample-data.ts

import { DataSource } from 'typeorm';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import {
    Agent,
    AgentVerificationStatus,
    AgentSubscriptionTier,
    AgentStatus
} from '../../modules/agents/entities/agent.entity';
import {
    Property,
    PropertyType,
    PropertyVerificationStatus,
    PropertyStatus
} from '../../modules/properties/entities/property.entity';

export class CreateSampleData {
    constructor(private dataSource: DataSource) { }

    async run(): Promise<void> {
        console.log('🌱 Creating sample data for SettleSmart AI...');

        try {
            // Create sample users (property seekers)
            await this.createSampleUsers();

            // Create sample agents (real estate agents)
            await this.createSampleAgents();

            // Create sample properties (rental listings in Lugbe)
            await this.createSampleProperties();

            console.log('Sample data created successfully!');
            console.log('Created: 10 users, 5 agents, 20 properties in Lugbe, Abuja');

        } catch (error) {
            console.error('Error creating sample data:', error);
            throw error;
        }
    }

    private async createSampleUsers(): Promise<void> {
        const userRepository = this.dataSource.getRepository(User);

        const sampleUsers = [
            {
                phone_number: '+2348123456789',
                name: 'Adebayo Johnson',
                location_preference: 'Lugbe, Abuja',
                budget_min: 300000,
                budget_max: 600000,
                preferences: {
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: ['parking', 'security', 'power'],
                    propertyTypes: ['flat'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 3,
            },
            {
                phone_number: '+2348134567890',
                name: 'Fatima Usman',
                location_preference: 'Lugbe Phase 1, Abuja',
                budget_min: 200000,
                budget_max: 400000,
                preferences: {
                    bedrooms: 1,
                    bathrooms: 1,
                    amenities: ['power', 'water', 'security'],
                    propertyTypes: ['room', 'self-contain'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 5,
            },
            {
                phone_number: '+2348145678901',
                name: 'Chidi Okonkwo',
                location_preference: 'Lugbe Phase 2, Abuja',
                budget_min: 500000,
                budget_max: 900000,
                preferences: {
                    bedrooms: 3,
                    bathrooms: 3,
                    amenities: ['parking', 'security', 'power', 'generator'],
                    propertyTypes: ['house', 'flat'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 8,
            },
            {
                phone_number: '+2348156789012',
                name: 'Blessing Okoro',
                location_preference: 'Lugbe, Abuja',
                budget_min: 250000,
                budget_max: 500000,
                preferences: {
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: ['security', 'power', 'water'],
                    propertyTypes: ['flat'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 2,
            },
            {
                phone_number: '+2348167890123',
                name: 'Ibrahim Yakubu',
                location_preference: 'Lugbe Phase 1, Abuja',
                budget_min: 180000,
                budget_max: 350000,
                preferences: {
                    bedrooms: 1,
                    bathrooms: 1,
                    amenities: ['power', 'security'],
                    propertyTypes: ['room', 'self-contain'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 4,
            },
            {
                phone_number: '+2348178901234',
                name: 'Grace Eze',
                location_preference: 'Lugbe, Abuja',
                budget_min: 400000,
                budget_max: 700000,
                preferences: {
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: ['parking', 'security', 'power', 'internet'],
                    propertyTypes: ['flat'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 6,
            },
            {
                phone_number: '+2348189012345',
                name: 'Musa Garba',
                location_preference: 'Lugbe Phase 2, Abuja',
                budget_min: 600000,
                budget_max: 1000000,
                preferences: {
                    bedrooms: 3,
                    bathrooms: 3,
                    amenities: ['parking', 'security', 'power', 'generator', 'aircon'],
                    propertyTypes: ['house'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 7,
            },
            {
                phone_number: '+2348190123456',
                name: 'Aisha Mohammed',
                location_preference: 'Lugbe, Abuja',
                budget_min: 220000,
                budget_max: 450000,
                preferences: {
                    bedrooms: 1,
                    bathrooms: 1,
                    amenities: ['security', 'power', 'water'],
                    propertyTypes: ['flat', 'room'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 3,
            },
            {
                phone_number: '+2348101234567',
                name: 'Emeka Nwachukwu',
                location_preference: 'Lugbe Phase 1, Abuja',
                budget_min: 350000,
                budget_max: 650000,
                preferences: {
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: ['parking', 'security', 'power', 'water'],
                    propertyTypes: ['flat'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 5,
            },
            {
                phone_number: '+2348112345678',
                name: 'Kemi Adebisi',
                location_preference: 'Lugbe, Abuja',
                budget_min: 280000,
                budget_max: 550000,
                preferences: {
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: ['security', 'power', 'generator'],
                    propertyTypes: ['flat', 'house'],
                },
                status: UserStatus.ACTIVE,
                properties_viewed: 4,
            },
        ];

        for (const userData of sampleUsers) {
            const existingUser = await userRepository.findOne({
                where: { phone_number: userData.phone_number }
            });

            if (!existingUser) {
                const user = userRepository.create(userData);
                await userRepository.save(user);
                console.log(`Created user: ${userData.name} (${userData.phone_number})`);
            }
        }
    }

    private async createSampleAgents(): Promise<void> {
        const agentRepository = this.dataSource.getRepository(Agent);

        const sampleAgents = [
            {
                phone_number: '+2347123456789',
                name: 'Ahmed Bello',
                email: 'ahmed.bello@lugbeproperties.com',
                business_name: 'Lugbe Properties Ltd',
                verification_status: AgentVerificationStatus.VERIFIED,
                subscription_tier: AgentSubscriptionTier.PREMIUM,
                subscription_expires_at: new Date('2025-12-31'),
                location: 'Lugbe, Abuja',
                rating: 4.7,
                total_ratings: 23,
                status: AgentStatus.ACTIVE,
                successful_leads: 18,
                total_leads: 25,
            },
            {
                phone_number: '+2347134567890',
                name: 'Funmi Adeyemi',
                email: 'funmi@abujarentals.ng',
                business_name: 'Abuja Rentals Hub',
                verification_status: AgentVerificationStatus.VERIFIED,
                subscription_tier: AgentSubscriptionTier.BASIC,
                location: 'Lugbe Phase 1, Abuja',
                rating: 4.4,
                total_ratings: 15,
                status: AgentStatus.ACTIVE,
                successful_leads: 12,
                total_leads: 18,
            },
            {
                phone_number: '+2347145678901',
                name: 'David Okafor',
                email: 'david@primerealestate.com.ng',
                business_name: 'Prime Real Estate Nigeria',
                verification_status: AgentVerificationStatus.VERIFIED,
                subscription_tier: AgentSubscriptionTier.PREMIUM,
                subscription_expires_at: new Date('2025-11-30'),
                location: 'Lugbe Phase 2, Abuja',
                rating: 4.8,
                total_ratings: 31,
                status: AgentStatus.ACTIVE,
                successful_leads: 24,
                total_leads: 32,
            },
            {
                phone_number: '+2347156789012',
                name: 'Hauwa Aliyu',
                email: 'hauwa.aliyu@gmail.com',
                business_name: 'H&A Properties',
                verification_status: AgentVerificationStatus.VERIFIED,
                subscription_tier: AgentSubscriptionTier.BASIC,
                location: 'Lugbe, Abuja',
                rating: 4.2,
                total_ratings: 9,
                status: AgentStatus.ACTIVE,
                successful_leads: 7,
                total_leads: 12,
            },
            {
                phone_number: '+2347167890123',
                name: 'Uche Obi',
                email: 'uche@fcthomes.ng',
                business_name: 'FCT Homes',
                verification_status: AgentVerificationStatus.PENDING,
                subscription_tier: AgentSubscriptionTier.BASIC,
                location: 'Lugbe Phase 1, Abuja',
                rating: 0,
                total_ratings: 0,
                status: AgentStatus.ACTIVE,
                successful_leads: 0,
                total_leads: 2,
            },
        ];

        for (const agentData of sampleAgents) {
            const existingAgent = await agentRepository.findOne({
                where: { phone_number: agentData.phone_number }
            });

            if (!existingAgent) {
                const agent = agentRepository.create(agentData);
                await agentRepository.save(agent);
                console.log(`Created agent: ${agentData.name} (${agentData.business_name})`);
            }
        }
    }

    private async createSampleProperties(): Promise<void> {
        const propertyRepository = this.dataSource.getRepository(Property);
        const agentRepository = this.dataSource.getRepository(Agent);

        // Get created agents
        const agents = await agentRepository.find();
        if (agents.length === 0) {
            throw new Error('No agents found. Please create agents first.');
        }

        const sampleProperties = [
            // Agent 1 - Ahmed Bello (Premium agent - can have many listings)
            {
                agent_id: agents[0].id,
                title: 'Modern 2BR Flat in Lugbe Phase 1',
                description: 'Spacious 2-bedroom flat with modern fittings, adequate parking space, and 24/7 security. Located in the heart of Lugbe Phase 1 with easy access to major roads.',
                property_type: PropertyType.FLAT,
                price: 450000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Near Lugbe Market',
                    coordinates: { latitude: 8.7832, longitude: 7.3986 }
                },
                bedrooms: 2,
                bathrooms: 2,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: true,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: true
                },
                images: [
                    'https://example.com/images/lugbe_flat_1_1.jpg',
                    'https://example.com/images/lugbe_flat_1_2.jpg'
                ],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 8,
                view_count: 15,
            },
            {
                agent_id: agents[0].id,
                title: 'Affordable 1BR Self-Contain in Lugbe',
                description: 'Clean and comfortable self-contain apartment perfect for singles or couples. Includes kitchen and bathroom. Safe neighborhood with good security.',
                property_type: PropertyType.SELF_CONTAIN,
                price: 280000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Behind First Bank',
                    coordinates: { latitude: 8.7825, longitude: 7.3980 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: false,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_selfcontain_1.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 12,
                view_count: 22,
            },
            {
                agent_id: agents[0].id,
                title: 'Luxury 3BR House with Generator',
                description: 'Beautiful 3-bedroom detached house with spacious compound, parking for 2 cars, and standby generator. Family-friendly environment.',
                property_type: PropertyType.HOUSE,
                price: 750000,
                location: {
                    area: 'Lugbe Phase 2',
                    landmark: 'Near Phase 2 Primary School',
                    coordinates: { latitude: 8.7845, longitude: 7.4020 }
                },
                bedrooms: 3,
                bathrooms: 3,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: true,
                    generator: true,
                    aircon: true,
                    furnished: false,
                    kitchen: true,
                    balcony: true
                },
                images: [
                    'https://example.com/images/lugbe_house_1_1.jpg',
                    'https://example.com/images/lugbe_house_1_2.jpg',
                    'https://example.com/images/lugbe_house_1_3.jpg'
                ],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 5,
                view_count: 9,
            },

            // Agent 2 - Funmi Adeyemi (Basic agent)
            {
                agent_id: agents[1].id,
                title: 'Cozy 2BR Flat Near Lugbe Market',
                description: 'Well-maintained 2-bedroom flat in a quiet area of Lugbe Phase 1. Walking distance to market and transport. Suitable for small families.',
                property_type: PropertyType.FLAT,
                price: 380000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Lugbe Market Junction',
                    coordinates: { latitude: 8.7828, longitude: 7.3975 }
                },
                bedrooms: 2,
                bathrooms: 2,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_flat_2_1.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 6,
                view_count: 11,
            },
            {
                agent_id: agents[1].id,
                title: 'Single Room in Shared Compound',
                description: 'Single room in a clean compound with shared facilities. Perfect for students or young professionals. Safe and secure environment.',
                property_type: PropertyType.ROOM,
                price: 150000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Near Central Mosque',
                    coordinates: { latitude: 8.7820, longitude: 7.3970 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: false,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: false,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_room_1.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 15,
                view_count: 28,
            },

            // Agent 3 - David Okafor (Premium agent)
            {
                agent_id: agents[2].id,
                title: 'Executive 2BR with Air Conditioning',
                description: 'Premium 2-bedroom flat with modern amenities including air conditioning, fitted kitchen, and 24/7 power supply. Located in upscale area of Lugbe Phase 2.',
                property_type: PropertyType.FLAT,
                price: 650000,
                location: {
                    area: 'Lugbe Phase 2',
                    landmark: 'Opposite Police Station',
                    coordinates: { latitude: 8.7850, longitude: 7.4010 }
                },
                bedrooms: 2,
                bathrooms: 2,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: true,
                    generator: true,
                    aircon: true,
                    furnished: true,
                    kitchen: true,
                    balcony: true
                },
                images: [
                    'https://example.com/images/lugbe_executive_1_1.jpg',
                    'https://example.com/images/lugbe_executive_1_2.jpg'
                ],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 4,
                view_count: 7,
            },
            {
                agent_id: agents[2].id,
                title: '4BR Family House with Compound',
                description: 'Spacious 4-bedroom detached house with large compound, BQ, and parking for multiple cars. Perfect for large families. Excellent security.',
                property_type: PropertyType.HOUSE,
                price: 950000,
                location: {
                    area: 'Lugbe Phase 2',
                    landmark: 'Behind Winners Chapel',
                    coordinates: { latitude: 8.7855, longitude: 7.4025 }
                },
                bedrooms: 4,
                bathrooms: 4,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: true,
                    generator: true,
                    aircon: true,
                    furnished: false,
                    kitchen: true,
                    balcony: true
                },
                images: [
                    'https://example.com/images/lugbe_family_house_1.jpg',
                    'https://example.com/images/lugbe_family_house_2.jpg',
                    'https://example.com/images/lugbe_family_house_3.jpg'
                ],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 2,
                view_count: 4,
            },
            {
                agent_id: agents[2].id,
                title: 'Modern 1BR Apartment',
                description: 'Newly built 1-bedroom apartment with contemporary design. All modern amenities included. Great for young professionals.',
                property_type: PropertyType.FLAT,
                price: 420000,
                location: {
                    area: 'Lugbe Phase 2',
                    landmark: 'Near Phase 2 Gate',
                    coordinates: { latitude: 8.7842, longitude: 7.4005 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: true,
                    generator: true,
                    aircon: false,
                    furnished: true,
                    kitchen: true,
                    balcony: true
                },
                images: [
                    'https://example.com/images/lugbe_modern_1br_1.jpg',
                    'https://example.com/images/lugbe_modern_1br_2.jpg'
                ],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 9,
                view_count: 16,
            },

            // Agent 4 - Hauwa Aliyu (Basic agent)
            {
                agent_id: agents[3].id,
                title: 'Budget-Friendly 2BR in Lugbe',
                description: 'Affordable 2-bedroom flat suitable for small families. Basic amenities provided. Good location with easy access to transportation.',
                property_type: PropertyType.FLAT,
                price: 320000,
                location: {
                    area: 'Lugbe',
                    landmark: 'Near Lugbe Junction',
                    coordinates: { latitude: 8.7815, longitude: 7.3965 }
                },
                bedrooms: 2,
                bathrooms: 2,
                amenities: {
                    parking: false,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_budget_2br.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 11,
                view_count: 19,
            },
            {
                agent_id: agents[3].id,
                title: 'Clean Self-Contain with Kitchen',
                description: 'Well-maintained self-contain apartment with private kitchen and bathroom. Suitable for singles or couples. Quiet neighborhood.',
                property_type: PropertyType.SELF_CONTAIN,
                price: 250000,
                location: {
                    area: 'Lugbe',
                    landmark: 'Behind GTBank',
                    coordinates: { latitude: 8.7810, longitude: 7.3960 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: false,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_selfcontain_2.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 7,
                view_count: 13,
            },

            // Agent 5 - Uche Obi (New agent, pending verification)
            {
                agent_id: agents[4].id,
                title: 'Spacious Room in Family House',
                description: 'Large room in a family compound with shared facilities. Very affordable option for students or young workers. Safe environment.',
                property_type: PropertyType.ROOM,
                price: 120000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Near Community Center',
                    coordinates: { latitude: 8.7822, longitude: 7.3972 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: false,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: false,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_room_2.jpg'],
                verification_status: PropertyVerificationStatus.PENDING,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 3,
                view_count: 8,
            },

            // Additional properties to reach 20 total
            {
                agent_id: agents[0].id,
                title: '3BR Duplex with Modern Facilities',
                description: 'Beautiful 3-bedroom duplex with all modern amenities. Features include fitted kitchen, spacious living room, and private parking.',
                property_type: PropertyType.HOUSE,
                price: 850000,
                location: {
                    area: 'Lugbe Phase 2',
                    landmark: 'Opposite Shoprite',
                    coordinates: { latitude: 8.7860, longitude: 7.4030 }
                },
                bedrooms: 3,
                bathrooms: 3,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: true,
                    generator: true,
                    aircon: true,
                    furnished: false,
                    kitchen: true,
                    balcony: true
                },
                images: [
                    'https://example.com/images/lugbe_duplex_1.jpg',
                    'https://example.com/images/lugbe_duplex_2.jpg'
                ],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 3,
                view_count: 6,
            },
            {
                agent_id: agents[1].id,
                title: 'Standard 2BR for Young Families',
                description: 'Well-located 2-bedroom flat perfect for young families. Good security, reliable power supply, and close to schools and markets.',
                property_type: PropertyType.FLAT,
                price: 400000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Near Primary School',
                    coordinates: { latitude: 8.7830, longitude: 7.3978 }
                },
                bedrooms: 2,
                bathrooms: 2,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: true,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: true
                },
                images: ['https://example.com/images/lugbe_family_flat.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 8,
                view_count: 14,
            },
            {
                agent_id: agents[2].id,
                title: 'Premium Self-Contain with Generator',
                description: 'High-quality self-contain apartment with private generator, modern fittings, and excellent security. Great value for money.',
                property_type: PropertyType.SELF_CONTAIN,
                price: 350000,
                location: {
                    area: 'Lugbe Phase 2',
                    landmark: 'Near New Market',
                    coordinates: { latitude: 8.7848, longitude: 7.4015 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: true,
                    aircon: false,
                    furnished: true,
                    kitchen: true,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_premium_selfcontain.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 5,
                view_count: 9,
            },
            {
                agent_id: agents[3].id,
                title: 'Comfortable Room Near Transport',
                description: 'Single room in a compound with good transport links. Shared bathroom and kitchen facilities. Budget-friendly option.',
                property_type: PropertyType.ROOM,
                price: 140000,
                location: {
                    area: 'Lugbe',
                    landmark: 'Bus Stop Junction',
                    coordinates: { latitude: 8.7812, longitude: 7.3962 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: false,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: false,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_transport_room.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 12,
                view_count: 21,
            },
            {
                agent_id: agents[0].id,
                title: '1BR Apartment with Balcony',
                description: 'Bright 1-bedroom apartment with spacious balcony overlooking the neighborhood. Modern kitchen and bathroom fittings.',
                property_type: PropertyType.FLAT,
                price: 380000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Near Water Board',
                    coordinates: { latitude: 8.7835, longitude: 7.3982 }
                },
                bedrooms: 1,
                bathrooms: 1,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: true
                },
                images: [
                    'https://example.com/images/lugbe_1br_balcony_1.jpg',
                    'https://example.com/images/lugbe_1br_balcony_2.jpg'
                ],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 6,
                view_count: 12,
            },
            {
                agent_id: agents[2].id,
                title: '2BR Flat with Parking Space',
                description: 'Standard 2-bedroom flat with dedicated parking space. Well-maintained building with good security and regular power supply.',
                property_type: PropertyType.FLAT,
                price: 480000,
                location: {
                    area: 'Lugbe Phase 2',
                    landmark: 'Near Health Center',
                    coordinates: { latitude: 8.7852, longitude: 7.4018 }
                },
                bedrooms: 2,
                bathrooms: 2,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: true,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: false
                },
                images: ['https://example.com/images/lugbe_2br_parking.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.AVAILABLE,
                is_available: true,
                inquiry_count: 4,
                view_count: 8,
            },
            // Add one rented property for testing
            {
                agent_id: agents[1].id,
                title: 'Recently Rented 2BR Flat',
                description: 'This property has been successfully rented out. It was a popular 2-bedroom flat in Lugbe Phase 1.',
                property_type: PropertyType.FLAT,
                price: 420000,
                location: {
                    area: 'Lugbe Phase 1',
                    landmark: 'Near Filling Station',
                    coordinates: { latitude: 8.7825, longitude: 7.3976 }
                },
                bedrooms: 2,
                bathrooms: 2,
                amenities: {
                    parking: true,
                    security: true,
                    power: true,
                    water: true,
                    internet: false,
                    generator: false,
                    aircon: false,
                    furnished: false,
                    kitchen: true,
                    balcony: true
                },
                images: ['https://example.com/images/lugbe_rented_flat.jpg'],
                verification_status: PropertyVerificationStatus.VERIFIED,
                status: PropertyStatus.RENTED,
                is_available: false,
                inquiry_count: 15,
                view_count: 25,
                rented_at: new Date('2025-01-20'),
            },
        ];

        let createdCount = 0;
        for (const propertyData of sampleProperties) {
            const existingProperty = await propertyRepository.findOne({
                where: {
                    title: propertyData.title,
                    agent_id: propertyData.agent_id
                }
            });

            if (!existingProperty) {
                const property = propertyRepository.create(propertyData);
                await propertyRepository.save(property);
                createdCount++;
                console.log(`✅ Created property: ${propertyData.title} (₦${propertyData.price.toLocaleString()})`);
            }
        }

        console.log(`Created ${createdCount} properties in Lugbe, Abuja`);
    }

    // Utility method to run the seeder
    static async seed(dataSource: DataSource): Promise<void> {
        const seeder = new CreateSampleData(dataSource);
        await seeder.run();
    }
}