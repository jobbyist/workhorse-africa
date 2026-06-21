
-- Drop legacy sales-era tables
DROP TABLE IF EXISTS public.vehicle_seller_contacts CASCADE;
DROP TABLE IF EXISTS public.vehicle_inquiries CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- =========================
-- rental_suppliers
-- =========================
CREATE TABLE public.rental_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  rating NUMERIC(2,1) DEFAULT 4.0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rental_suppliers TO anon, authenticated;
GRANT ALL ON public.rental_suppliers TO service_role;
ALTER TABLE public.rental_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rental_suppliers public read" ON public.rental_suppliers FOR SELECT USING (true);
CREATE POLICY "rental_suppliers admin write" ON public.rental_suppliers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- rental_listings (aggregated supplier inventory)
-- =========================
CREATE TABLE public.rental_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.rental_suppliers(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  category TEXT NOT NULL DEFAULT 'economy', -- economy, compact, suv, luxury, sports, van
  transmission TEXT DEFAULT 'automatic',
  fuel_type TEXT DEFAULT 'petrol',
  seats INT DEFAULT 5,
  daily_rate NUMERIC(10,2) NOT NULL,
  weekly_rate NUMERIC(10,2),
  monthly_rate NUMERIC(10,2),
  image_url TEXT,
  city TEXT NOT NULL,
  is_luxury BOOLEAN NOT NULL DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  deeplink_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rental_listings_city ON public.rental_listings(city);
CREATE INDEX idx_rental_listings_supplier ON public.rental_listings(supplier_id);
CREATE INDEX idx_rental_listings_luxury ON public.rental_listings(is_luxury);
GRANT SELECT ON public.rental_listings TO anon, authenticated;
GRANT ALL ON public.rental_listings TO service_role;
ALTER TABLE public.rental_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rental_listings public read" ON public.rental_listings FOR SELECT USING (is_active = true);
CREATE POLICY "rental_listings admin write" ON public.rental_listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_rental_listings_updated_at BEFORE UPDATE ON public.rental_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- luxury_waitlist
-- =========================
CREATE TABLE public.luxury_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  desired_vehicle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.luxury_waitlist TO anon, authenticated;
GRANT SELECT, DELETE ON public.luxury_waitlist TO authenticated;
GRANT ALL ON public.luxury_waitlist TO service_role;
ALTER TABLE public.luxury_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "luxury_waitlist anyone can join" ON public.luxury_waitlist FOR INSERT
  WITH CHECK (length(name) > 0 AND email ~* '^[^@]+@[^@]+\.[^@]+$');
CREATE POLICY "luxury_waitlist admin read" ON public.luxury_waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "luxury_waitlist admin delete" ON public.luxury_waitlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- p2p_listings (peer-to-peer rentals)
-- =========================
CREATE TABLE public.p2p_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  description TEXT,
  city TEXT NOT NULL,
  location TEXT,
  daily_rate NUMERIC(10,2) NOT NULL,
  weekly_rate NUMERIC(10,2),
  monthly_rate NUMERIC(10,2),
  transmission TEXT DEFAULT 'automatic',
  fuel_type TEXT DEFAULT 'petrol',
  seats INT DEFAULT 5,
  images JSONB DEFAULT '[]'::jsonb,
  primary_image_url TEXT,
  available_from DATE,
  available_to DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, removed
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_p2p_listings_owner ON public.p2p_listings(owner_id);
CREATE INDEX idx_p2p_listings_city ON public.p2p_listings(city);
CREATE INDEX idx_p2p_listings_status ON public.p2p_listings(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.p2p_listings TO authenticated;
GRANT SELECT ON public.p2p_listings TO anon;
GRANT ALL ON public.p2p_listings TO service_role;
ALTER TABLE public.p2p_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p2p_listings public view active" ON public.p2p_listings FOR SELECT USING (status = 'active');
CREATE POLICY "p2p_listings owner view own" ON public.p2p_listings FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "p2p_listings owner insert" ON public.p2p_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "p2p_listings owner update" ON public.p2p_listings FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "p2p_listings owner delete" ON public.p2p_listings FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "p2p_listings admin all" ON public.p2p_listings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_p2p_listings_updated_at BEFORE UPDATE ON public.p2p_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- p2p_bookings
-- =========================
CREATE TABLE public.p2p_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.p2p_listings(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_p2p_bookings_listing ON public.p2p_bookings(listing_id);
CREATE INDEX idx_p2p_bookings_renter ON public.p2p_bookings(renter_id);
CREATE INDEX idx_p2p_bookings_owner ON public.p2p_bookings(owner_id);
GRANT SELECT, INSERT, UPDATE ON public.p2p_bookings TO authenticated;
GRANT ALL ON public.p2p_bookings TO service_role;
ALTER TABLE public.p2p_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p2p_bookings renter view" ON public.p2p_bookings FOR SELECT TO authenticated USING (auth.uid() = renter_id);
CREATE POLICY "p2p_bookings owner view" ON public.p2p_bookings FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "p2p_bookings renter create" ON public.p2p_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "p2p_bookings parties update" ON public.p2p_bookings FOR UPDATE TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);
CREATE POLICY "p2p_bookings admin all" ON public.p2p_bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_p2p_bookings_updated_at BEFORE UPDATE ON public.p2p_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- platform_settings
-- =========================
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_settings public read" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "platform_settings admin write" ON public.platform_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_settings (key, value) VALUES
  ('commission_rate', '0.05'::jsonb),
  ('ads_enabled', 'true'::jsonb);

-- Seed suppliers
INSERT INTO public.rental_suppliers (name, slug, rating, description, website_url) VALUES
  ('Avis', 'avis', 4.5, 'Trusted global rental brand with extensive SA coverage.', 'https://www.avis.co.za'),
  ('Budget', 'budget', 4.2, 'Affordable rentals across South Africa.', 'https://www.budget.co.za'),
  ('Europcar', 'europcar', 4.3, 'Premium European rental fleet.', 'https://www.europcar.co.za'),
  ('Hertz', 'hertz', 4.4, 'Global rental leader.', 'https://www.hertz.co.za'),
  ('SANI Car Rental', 'sani', 4.1, 'Local SA rental specialists.', 'https://www.sanirental.co.za'),
  ('Booking.com Rental Cars', 'booking', 4.6, 'Compare millions of cars worldwide.', 'https://cars.booking.com'),
  ('First Car Rental', 'first', 4.3, 'Award-winning South African rental.', 'https://www.firstcarrental.co.za'),
  ('Tempest Car Hire', 'tempest', 4.2, 'Trusted local rental brand.', 'https://www.tempestcarhire.co.za'),
  ('Woodford Car Hire', 'woodford', 4.4, 'Quality vehicles, friendly service.', 'https://www.woodford.co.za');
