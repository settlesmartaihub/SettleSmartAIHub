# SettleSmart AI Backend

**Intelligent Property Matching on WhatsApp - Your Smart Way Home in Nigeria**

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-11+-red" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5+-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16+-blue" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/WhatsApp-Business_API-green" alt="WhatsApp" />
  <img src="https://img.shields.io/badge/License-UNLICENSED-yellow" alt="License" />
</p>

## SettleSmart AI

SettleSmart AI is a revolutionary multilingual virtual assistant on WhatsApp that transforms property discovery in Nigeria. We're making finding and securing property simple, trustworthy, and accessible for everyone through intelligent conversational technology.

### Mission
To make finding and securing property in Nigeria simple, trustworthy, and accessible for everyone through intelligent conversational technology.

### Key Features
- **Conversational Search**: Chat in plain English or Pidgin (Yoruba, Hausa, Igbo planned)
- **Verified Connections**: Vetted local real estate agents and curated property listings
- **WhatsApp Native**: No app download required, works on Nigeria's most popular platform
- **Accessibility First**: Low data consumption, designed for all literacy levels
- **Agent Empowerment**: Simple tools for independent agents and small agencies

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SettleSmart-AI/SettleSmartAI.git
   cd settlesmart-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

### Project Structure

```bash
src/
├── app.module.ts
├── main.ts
├── common/                   # Shared utilities
│   ├── decorators/        	# Custom decorators
│   ├── filters/           	# Exception filters
│   ├── guards/            	# Auth guards
│   ├── interceptors/      	# Response interceptors
│   ├── middleware/        	# Custom middleware
│   ├── pipes/             	# Validation pipes
│   └── utils/             	# Helper functions
├── config/                	# Configuration files
│   ├── database.config.ts    
│   ├── app.config.ts
│   └── validation.schema.ts
├── modules/
│   ├── auth/              	# Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   ├── users/             	# User management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── agents/            	# Agent management
│   │   ├── agents.controller.ts
│   │   ├── agents.service.ts
│   │   ├── agents.module.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── properties/        	# Property listings
│   │   ├── properties.controller.ts
│   │   ├── properties.service.ts
│   │   ├── properties.module.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── whatsapp/         	# WhatsApp integration
│   │   ├── whatsapp.controller.ts
│   │   ├── whatsapp.service.ts
│   │   ├── whatsapp.module.ts
│   │   ├── handlers/     	# Message handlers
│   │   └── dto/
│   ├── ai/               	# AI/NLP services
│   │   ├── ai.service.ts
│   │   ├── ai.module.ts
│   │   ├── nlp/          	# Natural Language Processing
│   │   ├── voice/        	# Voice processing
│   │   └── matching/     	# Property matching logic
│   ├── conversations/    	# Chat history
│   │   ├── conversations.controller.ts
│   │   ├── conversations.service.ts
│   │   ├── conversations.module.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── notifications/    	# Notification system
│   │   ├── notifications.service.ts
│   │   ├── notifications.module.ts
│   │   └── templates/
│   ├── analytics/       	# Analytics & reporting
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── analytics.module.ts
│   │   └── dto/
│   └── admin/          	# Admin panel APIs
│   	├── admin.controller.ts
│   	├── admin.service.ts
│   	├── admin.module.ts
│   	└── dto/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── data-source.ts
└── tests/
	├── unit/
	├── integration/
	└── e2e/
```

### Running the Application

```bash
# test configuration
npx ts-node test-config.ts

# Run all tests
npm test

# Coverage report
npm run test:coverage

# End-to-end tests
npm run test:e2e
```

#### Demo Functions

```bash
# Run comprehensive function demonstration
npx ts-node demo-functions.ts
```

### Architecture & Tech Stack

**Backend Framework**

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **TypeORM** - Database ORM

**Database**

- PostgreSQL

**External Services**

- Twilio WhatsApp Business API - WhatsApp integration
- OpenAI API - Natural language processing
- Cohere API (planned) - Multilingual NLP support

### Key Features Implemented 

**Security & Authentication**

- JWT-based authentication
- Role-based access control (User, Agent, Admin)
- Password hashing with bcrypt
- Rate limiting for WhatsApp endpoints
- Input validation and sanitization

**Nigerian Phone Number Utilities**

- Automatic phone number normalization
- Support for multiple Nigerian formats (08xxx, +234xxx, 234xxx)
- Phone number validation
- Display formatting (+234 XXX XXX XXXX)

**Standardized API Responses**

- Consistent success/error response format
- Pagination support
- Timestamp tracking
- Error handling with proper HTTP status codes

**Encryption & Security Utils**

- Secure password hashing
- Random token generation
- OTP generation for verification
- Cryptographically secure random values




