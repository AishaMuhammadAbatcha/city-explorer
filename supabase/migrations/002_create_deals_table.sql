-- Create deals/promotions table for businesses

CREATE TABLE IF NOT EXISTS public.deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount TEXT NOT NULL, -- e.g., "20% off", "Buy 1 Get 1 Free"
    discount_percentage NUMERIC(5,2), -- Optional: numeric percentage for sorting/filtering
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    terms_and_conditions TEXT,
    max_redemptions INTEGER, -- Maximum number of times this deal can be redeemed
    current_redemptions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'paused', 'draft')),
    image_url TEXT,
    category TEXT, -- e.g., "Food & Drink", "Services", "Retail"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS deals_business_id_idx ON public.deals(business_id);
CREATE INDEX IF NOT EXISTS deals_status_idx ON public.deals(status);
CREATE INDEX IF NOT EXISTS deals_valid_until_idx ON public.deals(valid_until);
CREATE INDEX IF NOT EXISTS deals_category_idx ON public.deals(category);

-- Enable Row Level Security
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can view active deals
CREATE POLICY "Anyone can view active deals"
    ON public.deals
    FOR SELECT
    USING (status = 'active' AND valid_until > NOW());

-- Business owners can view all their deals
CREATE POLICY "Business owners can view own deals"
    ON public.deals
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Business owners can insert deals for their businesses
CREATE POLICY "Business owners can insert own deals"
    ON public.deals
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Business owners can update their own deals
CREATE POLICY "Business owners can update own deals"
    ON public.deals
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Business owners can delete their own deals
CREATE POLICY "Business owners can delete own deals"
    ON public.deals
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-expire deals
CREATE OR REPLACE FUNCTION auto_expire_deals()
RETURNS void AS $$
BEGIN
    UPDATE public.deals
    SET status = 'expired'
    WHERE valid_until < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE public.deals IS 'Stores promotional deals and offers from businesses';
