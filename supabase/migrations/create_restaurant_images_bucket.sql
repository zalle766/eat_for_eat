-- Allow authenticated users to upload images to restaurant-images bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to restaurant-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to restaurant-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-images');

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read restaurant-images" ON storage.objects;
CREATE POLICY "Allow public read restaurant-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated update restaurant-images" ON storage.objects;
CREATE POLICY "Allow authenticated update restaurant-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-images');
