-- Store category and province options in PostgreSQL instead of frontend arrays.
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

INSERT INTO marketplace_categories (id, label, sort_order) VALUES
    ('all', 'All vehicles', 0),
    ('car', 'Cars', 1),
    ('truck', 'Trucks', 2),
    ('motorcycle', 'Motorcycles', 3),
    ('tractor', 'Tractors', 4),
    ('construction', 'Equipment', 5),
    ('bus', 'Buses', 6),
    ('trailer', 'Trailers', 7),
    ('parts', 'Parts', 8),
    ('other', 'Other', 9)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO marketplace_provinces (name, sort_order, is_all) VALUES
    ('All Afghanistan', 0, true),
    ('Kabul', 1, false),
    ('Herat', 2, false),
    ('Balkh', 3, false),
    ('Kandahar', 4, false),
    ('Nangarhar', 5, false),
    ('Bamyan', 6, false),
    ('Badakhshan', 7, false),
    ('Ghazni', 8, false),
    ('Kunduz', 9, false)
ON CONFLICT (name) DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    is_all = EXCLUDED.is_all;

-- Disabled demo sellers own the former in-code sample listings.
INSERT INTO users (id, name, username, email, password_hash, role, seller_type, company_name, province) VALUES
    ('00000000-0000-4000-8000-000000000011', 'Balkh Motors', 'demo_balkh_motors', 'demo-balkh-motors@example.invalid', 'disabled$marketplace-seed', 'member', 'company', 'Balkh Motors', 'Kabul'),
    ('00000000-0000-4000-8000-000000000012', 'Ahmad Rahimi', 'demo_ahmad_rahimi', 'demo-ahmad@example.invalid', 'disabled$marketplace-seed', 'member', 'private', NULL, 'Herat'),
    ('00000000-0000-4000-8000-000000000013', 'Pamir Equipment', 'demo_pamir_equipment', 'demo-pamir-equipment@example.invalid', 'disabled$marketplace-seed', 'member', 'company', 'Pamir Equipment', 'Kandahar'),
    ('00000000-0000-4000-8000-000000000014', 'Laila Transport', 'demo_laila_transport', 'demo-laila-transport@example.invalid', 'disabled$marketplace-seed', 'member', 'company', 'Laila Transport', 'Herat')
ON CONFLICT DO NOTHING;

-- Seed records use fixed IDs so running the migration twice does not duplicate them.
INSERT INTO listings (
    id, seller_id, title, category, make, model, year, price, currency,
    province, mileage, fuel, transmission, condition, description, status, views
) VALUES
    ('00000000-0000-4000-8000-000000000101', (SELECT id FROM users WHERE email = 'demo-balkh-motors@example.invalid'), 'Toyota Land Cruiser VX 4.5', 'car', 'Toyota', 'Land Cruiser VX', 2021, 68500, 'USD', 'Kabul', 42000, 'Diesel', 'Automatic', 'used', 'Well maintained Land Cruiser with full service history, four-wheel drive and a comfortable interior. Inspection welcome in Kabul.', 'active', 248),
    ('00000000-0000-4000-8000-000000000102', (SELECT id FROM users WHERE email = 'demo-ahmad@example.invalid'), 'Honda CG 125 — clean condition', 'motorcycle', 'Honda', 'CG 125', 2022, 780, 'USD', 'Herat', 8500, 'Petrol', 'Manual', 'used', 'Recently serviced motorcycle. Papers are available and it is ready to ride.', 'active', 91),
    ('00000000-0000-4000-8000-000000000103', (SELECT id FROM users WHERE email = 'demo-pamir-equipment@example.invalid'), 'Caterpillar 320 Excavator', 'construction', 'Caterpillar', '320', 2019, 92500, 'USD', 'Kandahar', NULL, 'Diesel', 'Automatic', 'used', 'Strong working excavator, recently inspected. Contact our sales team to arrange a viewing.', 'active', 176),
    ('00000000-0000-4000-8000-000000000104', (SELECT id FROM users WHERE email = 'demo-pamir-equipment@example.invalid'), 'John Deere 6110M Farm Tractor', 'tractor', 'John Deere', '6110M', 2020, 59000, 'USD', 'Balkh', NULL, 'Diesel', 'Manual', 'used', '110 HP farm tractor with cab, maintained and available for inspection.', 'active', 114),
    ('00000000-0000-4000-8000-000000000105', (SELECT id FROM users WHERE email = 'demo-laila-transport@example.invalid'), 'Mercedes-Benz Actros 1845', 'truck', 'Mercedes-Benz', 'Actros 1845', 2018, 57000, 'USD', 'Herat', 186000, 'Diesel', 'Automatic', 'used', 'Clean heavy truck, regularly maintained. Contact us for documents and inspection.', 'active', 203),
    ('00000000-0000-4000-8000-000000000106', (SELECT id FROM users WHERE email = 'demo-pamir-equipment@example.invalid'), 'Alloy wheel set · 17 inch', 'parts', 'Universal', 'Alloy wheels', 2024, 420, 'USD', 'Kandahar', NULL, NULL, NULL, 'new', 'Four new alloy wheels. Ask us to confirm fitment for your vehicle.', 'active', 67)
ON CONFLICT (id) DO NOTHING;

INSERT INTO listing_images (id, listing_id, url, alt, position) VALUES
    ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1100&q=85', 'Toyota Land Cruiser VX 4.5', 0),
    ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000102', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1100&q=85', 'Honda CG 125', 0),
    ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000103', 'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?auto=format&fit=crop&w=1100&q=85', 'Caterpillar 320 Excavator', 0),
    ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000104', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85', 'John Deere 6110M Farm Tractor', 0),
    ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000105', 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1100&q=85', 'Mercedes-Benz Actros 1845', 0),
    ('00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000106', 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1100&q=85', 'Alloy wheel set · 17 inch', 0)
ON CONFLICT (id) DO NOTHING;
