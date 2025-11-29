# Dog Trainers Directory - Development Setup Guide

## Quick Start

This guide will help you set up the development environment for the Dog Trainers Directory project.

## Prerequisites

- Node.js 18+ (Active LTS recommended)
- npm or yarn
- Git
- Supabase account (free tier is sufficient for development)

## 1. Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dogtrainersdirectory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your actual values:
   - Create a new Supabase project at https://supabase.com
   - Copy the Project URL and Anon Key from Settings > API
   - Generate a Service Role Key from Settings > API
   - Get ABR GUID from Australian Business Register

4. **Database Setup**
   ```bash
   # Apply the database schema
   psql -h your-project-ref.supabase.co -U postgres -d postgres < supabase/schema.sql
   
   # Import geographic data
   psql -h your-project-ref.supabase.co -U postgres -d postgres < supabase/data-import.sql
   ```

   Alternatively, use the Supabase Dashboard:
   - Go to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Then copy and paste the contents of `supabase/data-import.sql`

## 2. Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 3. Project Structure

```
src/
├── app/                    # Next.js 14 App Router pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Home page (triage)
├── components/              # Reusable React components
├── lib/                   # Utility libraries
│   └── supabase.ts       # Supabase client configuration
└── types/                  # TypeScript type definitions
    └── database.ts          # Database schema types

supabase/
├── schema.sql              # Complete database schema
└── data-import.sql          # Geographic data import
```

## 4. Key Features Implemented

### ✅ Completed
- Next.js 14 with TypeScript and Tailwind CSS
- Database schema with locked enums
- Geographic data (28 councils, 138 suburbs)
- Age-first triage interface
- Basic project structure and configuration

### 🚧 In Progress
- Supabase integration and authentication
- API endpoints for trainer search
- Suburb autocomplete functionality
- Trainer profile pages

### 📋 Planned
- Trainer onboarding flow
- ABN verification system
- Admin dashboard
- Stripe webhook infrastructure
- Comprehensive testing

## 5. Development Workflow

1. **Feature Development**
   - Create feature branches from `main`
   - Follow the Phase 1 implementation plan
   - Test locally before committing

2. **Database Changes**
   - Update `supabase/schema.sql` for schema changes
   - Test changes in local development
   - Document migration steps

3. **Code Quality**
   ```bash
   npm run lint          # Check code style
   npm run type-check     # Verify TypeScript types
   ```

## 6. Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check
```

## 7. Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ABR_GUID` | Australian Business Register GUID | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key (infrastructure only) | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | No |

## 8. Supabase Configuration

### Database Schema
The complete schema is defined in `supabase/schema.sql` with:
- Locked enums for ages, issues, services, and resources
- Row Level Security (RLS) policies
- Haversine distance function
- Optimized indexes

### Key Tables
- `councils` (28 records)
- `suburbs` (138 records)
- `profiles` (user profiles)
- `businesses` (trainer businesses)
- `trainer_specializations` (age specialties)
- `trainer_behavior_issues` (behavior issues)
- `trainer_services` (service types)
- `reviews` (customer reviews)
- `emergency_resources` (emergency services)

## 9. Feature Flags

The application uses feature flags to control Phase 1 scope:

```typescript
const FEATURE_FLAGS = {
  SCRAPER_ENABLED: false,           // Deferred to Phase 2
  MONETIZATION_UI_ENABLED: false,   // Deferred to Phase 4+
  AI_MODERATION_ENABLED: false,     // Optional in Phase 1
  PREMIUM_PROFILES_ENABLED: false  // Deferred to Phase 1.5+
}
```

## 10. Performance Targets

- Profile pages: <1s load time
- Directory pages: <2s load time  
- Suburb autocomplete: <200ms response

## 11. Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Supabase URL and keys in `.env.local`
   - Check Supabase project status
   - Ensure RLS policies are correctly applied

2. **TypeScript Errors**
   - Run `npm run type-check`
   - Check database types in `src/types/database.ts`
   - Ensure Supabase client is properly configured

3. **Styling Issues**
   - Verify Tailwind CSS is properly configured
   - Check `tailwind.config.js` for correct content paths
   - Ensure CSS imports are working

### Getting Help

1. Check the Phase 1 Implementation Plan: `PHASE1_IMPLEMENTATION_PLAN.md`
2. Review database schema: `supabase/schema.sql`
3. Consult project documentation in `DOCS/` directory

## 12. Next Steps

After completing the basic setup:

1. **Database & Auth** (Week 1)
   - Set up Supabase authentication
   - Configure Row Level Security policies
   - Test database connections

2. **Core APIs** (Week 2)
   - Implement triage API endpoint
   - Build search functionality
   - Create trainer profile APIs

3. **User Interface** (Week 3-4)
   - Complete dog owner journey
   - Build trainer onboarding
   - Create admin dashboard

4. **Integration** (Week 5-8)
   - ABN verification system
   - Stripe webhook infrastructure
   - Testing and documentation

## 13. Contributing Guidelines

1. Follow the existing code patterns and TypeScript types
2. Ensure all database operations use the defined enums
3. Test all new features with the geographic data
4. Update documentation when adding new features
5. Keep feature flags updated for Phase 1 scope

---

**Note**: This is a Phase 1 implementation focused on manual trainer onboarding and core directory functionality. Advanced features like scraping and monetization are deferred to later phases.