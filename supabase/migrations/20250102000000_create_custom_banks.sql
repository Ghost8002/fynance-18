-- Create custom_banks table for user-created banks
CREATE TABLE IF NOT EXISTS custom_banks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    website TEXT,
    description TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT custom_banks_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT custom_banks_short_name_not_empty CHECK (length(trim(short_name)) > 0),
    CONSTRAINT custom_banks_unique_user_name UNIQUE (user_id, name),
    CONSTRAINT custom_banks_unique_user_short_name UNIQUE (user_id, short_name),
    CONSTRAINT custom_banks_primary_color_format CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT custom_banks_secondary_color_format CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_banks_user_id ON custom_banks(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_banks_user_active ON custom_banks(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_banks_name ON custom_banks(name);
CREATE INDEX IF NOT EXISTS idx_custom_banks_short_name ON custom_banks(short_name);

-- Enable Row Level Security
ALTER TABLE custom_banks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own custom banks" ON custom_banks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom banks" ON custom_banks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom banks" ON custom_banks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom banks" ON custom_banks
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_banks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_custom_banks_updated_at
    BEFORE UPDATE ON custom_banks
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_banks_updated_at();

-- Add comment to table
COMMENT ON TABLE custom_banks IS 'Custom banks created by users that are not in the predefined bank database';
COMMENT ON COLUMN custom_banks.name IS 'Full name of the bank';
COMMENT ON COLUMN custom_banks.short_name IS 'Short/display name of the bank';
COMMENT ON COLUMN custom_banks.website IS 'Bank website URL (optional)';
COMMENT ON COLUMN custom_banks.description IS 'Optional description of the bank';
COMMENT ON COLUMN custom_banks.primary_color IS 'Primary brand color in hex format (e.g., #FF0000)';
COMMENT ON COLUMN custom_banks.secondary_color IS 'Secondary brand color in hex format (e.g., #FFFFFF)';
COMMENT ON COLUMN custom_banks.is_active IS 'Whether the bank is active (soft delete)';
