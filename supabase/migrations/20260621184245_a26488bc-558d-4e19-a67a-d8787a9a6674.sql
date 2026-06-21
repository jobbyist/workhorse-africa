
-- 1. Seller contacts: move to a restricted table
CREATE TABLE IF NOT EXISTS public.vehicle_seller_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_seller_contacts TO authenticated;
GRANT ALL ON public.vehicle_seller_contacts TO service_role;

ALTER TABLE public.vehicle_seller_contacts ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can view contact info for a listing (i.e. to contact seller)
CREATE POLICY "Authenticated users can view seller contacts"
  ON public.vehicle_seller_contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only the vehicle owner can insert/update/delete contacts for their listing
CREATE POLICY "Owners can insert seller contacts"
  ON public.vehicle_seller_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = vehicle_seller_contacts.event_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Owners can update seller contacts"
  ON public.vehicle_seller_contacts
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = vehicle_seller_contacts.event_id AND e.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = vehicle_seller_contacts.event_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Owners can delete seller contacts"
  ON public.vehicle_seller_contacts
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = vehicle_seller_contacts.event_id AND e.created_by = auth.uid()
  ));

CREATE TRIGGER update_vehicle_seller_contacts_updated_at
  BEFORE UPDATE ON public.vehicle_seller_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate any existing data, then drop columns from events
INSERT INTO public.vehicle_seller_contacts (event_id, email, phone)
SELECT id, seller_email, seller_phone
FROM public.events
WHERE seller_email IS NOT NULL OR seller_phone IS NOT NULL
ON CONFLICT (event_id) DO NOTHING;

ALTER TABLE public.events DROP COLUMN IF EXISTS seller_email;
ALTER TABLE public.events DROP COLUMN IF EXISTS seller_phone;

-- 2. Remove the permissive scraped-insert policy. Service role bypasses RLS.
DROP POLICY IF EXISTS "Service role can insert scraped events" ON public.events;

-- 3. Restrict profile reads to signed-in users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Tighten vehicle_inquiries insert
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.vehicle_inquiries;
CREATE POLICY "Anyone can create inquiries"
  ON public.vehicle_inquiries
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- 5. Storage policies for event-images bucket
CREATE POLICY "Public can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Revoke EXECUTE on has_role from public roles (still callable from RLS as definer)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
