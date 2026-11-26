-- Stores a phone number that can differ from the seller's profile number per listing.
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS seller_contact_phone varchar(40);
