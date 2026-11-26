CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE seller_type AS ENUM ('private', 'company');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_category AS ENUM (
        'car', 'motorcycle', 'truck', 'bus', 'tractor',
        'construction', 'trailer', 'parts', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE listing_condition AS ENUM ('new', 'used', 'damaged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('pending', 'active', 'rejected', 'blocked', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS marketplace_categories (
    id varchar(32) PRIMARY KEY,
    label varchar(80) NOT NULL,
    sort_order smallint NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS marketplace_provinces (
    name varchar(80) PRIMARY KEY,
    sort_order smallint NOT NULL UNIQUE,
    is_all boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(120) NOT NULL,
    username varchar(40),
    email varchar(254) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    seller_type seller_type NOT NULL DEFAULT 'private',
    company_name varchar(160),
    phone varchar(40),
    avatar_url text CHECK (avatar_url IS NULL OR avatar_url ~* '^https?://'),
    province varchar(80),
    city varchar(100),
    about text,
    blocked boolean NOT NULL DEFAULT false,
    block_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(40);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS about text;
-- Upgrade databases created before password_hash was introduced.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'password'
    ) THEN
        EXECUTE 'UPDATE users SET password_hash = password::text WHERE password_hash IS NULL AND password IS NOT NULL';
        EXECUTE 'ALTER TABLE users DROP COLUMN password';
    END IF;
END $$;
UPDATE users SET password_hash = 'disabled$' || gen_random_uuid()::text
WHERE password_hash IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
UPDATE users
SET username = COALESCE(
        NULLIF(left(regexp_replace(split_part(lower(email), '@', 1), '[^a-z0-9_.-]', '', 'g'), 25), ''),
        'user'
    ) || '_' || left(replace(id::text, '-', ''), 10)
WHERE username IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_uidx ON users (lower(username));

CREATE TABLE IF NOT EXISTS listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(180) NOT NULL,
    category vehicle_category NOT NULL,
    make varchar(100),
    model varchar(100),
    year smallint,
    first_registration date,
    price numeric(14, 2),
    currency char(3) NOT NULL DEFAULT 'USD',
    seller_contact_phone varchar(40),
    province varchar(80) NOT NULL,
    city varchar(100),
    mileage integer,
    fuel varchar(40),
    transmission varchar(40),
    body_type varchar(50),
    condition listing_condition NOT NULL DEFAULT 'used',
    description text,
    specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
    status listing_status NOT NULL DEFAULT 'pending',
    moderation_note text,
    views integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (year IS NULL OR year BETWEEN 1900 AND 2100),
    CHECK (price IS NULL OR price >= 0),
    CHECK (mileage IS NULL OR mileage >= 0)
);

CREATE TABLE IF NOT EXISTS listing_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url text NOT NULL CHECK (url ~* '^https?://'),
    alt varchar(180),
    position smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
    body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (sender_id <> recipient_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
    reported_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    admin_note text,
    evidence_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id bigserial PRIMARY KEY,
    admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action varchar(80) NOT NULL,
    target_type varchar(40) NOT NULL,
    target_id text,
    reason text,
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_status_created_idx ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_category_province_idx ON listings(category, province);
CREATE INDEX IF NOT EXISTS listings_make_model_year_idx ON listings(make, model, year);
CREATE INDEX IF NOT EXISTS listings_price_idx ON listings(price);
CREATE INDEX IF NOT EXISTS listing_images_position_idx ON listing_images(listing_id, position);
CREATE INDEX IF NOT EXISTS messages_recipient_date_idx ON messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_date_idx ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS users_role_blocked_idx ON users(role, blocked);
CREATE INDEX IF NOT EXISTS reports_status_created_idx ON reports(status, created_at DESC);
