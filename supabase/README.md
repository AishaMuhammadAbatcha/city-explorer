# Supabase Migrations

This directory contains SQL migration files for the City Explorer application.

## How to Apply Migrations

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Open each migration file in order and copy its contents
4. Paste the SQL into the SQL Editor
5. Click **Run** to execute the migration

**Migration Order:**
1. `001_create_notifications_table.sql` - Creates notifications table
2. `002_create_deals_table.sql` - Creates deals/promotions table
3. `003_add_review_responses.sql` - Adds business response fields to reviews

### Method 2: Using Supabase CLI (If installed)

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Method 3: Direct SQL Execution

You can also execute the SQL directly using your preferred database tool by connecting to your Supabase PostgreSQL database.

## What Each Migration Does

### 001_create_notifications_table.sql
- Creates the `notifications` table for user notifications
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance
- Adds triggers for automatic timestamp updates

### 002_create_deals_table.sql
- Creates the `deals` table for business promotions
- Includes fields for discount details, validity periods, and redemption tracking
- Sets up RLS policies to allow business owners to manage their deals
- Creates function to auto-expire deals

### 003_add_review_responses.sql
- Adds response fields to the existing `reviews` table
- Allows business owners to respond to reviews
- Creates a helper function for adding responses with proper permissions
- Updates RLS policies

## TypeScript Types

After applying migrations, update your TypeScript types by running:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

Or manually add these to your database types file:

```typescript
deals: {
  Row: {
    id: string
    business_id: string
    title: string
    description: string | null
    discount: string
    discount_percentage: number | null
    valid_from: string
    valid_until: string
    terms_and_conditions: string | null
    max_redemptions: number | null
    current_redemptions: number
    status: 'active' | 'expired' | 'paused' | 'draft'
    image_url: string | null
    category: string | null
    created_at: string
    updated_at: string
  }
  // ... Insert and Update types
}
```

## Rollback

If you need to rollback these migrations, you can run:

```sql
-- Rollback review responses
ALTER TABLE public.reviews
DROP COLUMN IF EXISTS business_response,
DROP COLUMN IF EXISTS business_response_date,
DROP COLUMN IF EXISTS business_response_by;

-- Drop deals table
DROP TABLE IF EXISTS public.deals CASCADE;

-- Drop notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;
```

## Notes

- All tables have Row Level Security (RLS) enabled
- Indexes are created for commonly queried fields
- Timestamps are automatically updated using triggers
- All foreign keys have proper CASCADE behaviors
