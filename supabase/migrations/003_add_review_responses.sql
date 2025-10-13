-- Add business response functionality to reviews table

-- Add columns for business responses to reviews
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS business_response TEXT,
ADD COLUMN IF NOT EXISTS business_response_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS business_response_by UUID REFERENCES auth.users(id);

-- Create index for reviews with responses
CREATE INDEX IF NOT EXISTS reviews_business_response_idx ON public.reviews(business_response)
WHERE business_response IS NOT NULL;

-- Update RLS policies to allow business owners to respond to reviews
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Business owners can update reviews with responses" ON public.reviews;

CREATE POLICY "Business owners can update reviews with responses"
    ON public.reviews
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Create a function to handle business responses
CREATE OR REPLACE FUNCTION add_business_response(
    review_id UUID,
    response_text TEXT
)
RETURNS public.reviews AS $$
DECLARE
    updated_review public.reviews;
BEGIN
    -- Check if the user owns the business
    IF NOT EXISTS (
        SELECT 1 FROM public.reviews r
        INNER JOIN public.businesses b ON r.business_id = b.id
        WHERE r.id = review_id AND b.owner_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have permission to respond to this review';
    END IF;

    -- Update the review with the response
    UPDATE public.reviews
    SET
        business_response = response_text,
        business_response_date = NOW(),
        business_response_by = auth.uid(),
        updated_at = NOW()
    WHERE id = review_id
    RETURNING * INTO updated_review;

    RETURN updated_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION add_business_response IS 'Allows business owners to respond to reviews on their business';
