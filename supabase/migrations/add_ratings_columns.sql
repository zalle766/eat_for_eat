-- إضافة الأعمدة المطلوبة لجدول ratings إذا لم تكن موجودة

-- إضافة عمود rating (integer) إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ratings' AND column_name = 'rating'
    ) THEN
        ALTER TABLE ratings ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    END IF;
END $$;

-- إضافة عمود comment (text) إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ratings' AND column_name = 'comment'
    ) THEN
        ALTER TABLE ratings ADD COLUMN comment TEXT;
    END IF;
END $$;

-- إضافة عمود product_id (uuid) إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ratings' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE ratings ADD COLUMN product_id UUID;
        -- إضافة foreign key constraint إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'ratings_product_id_fkey' AND table_name = 'ratings'
        ) THEN
            ALTER TABLE ratings ADD CONSTRAINT ratings_product_id_fkey 
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- إضافة عمود created_at إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ratings' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE ratings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- إضافة عمود updated_at إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ratings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ratings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- التحقق من وجود foreign key constraint لـ user_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ratings_user_id' AND table_name = 'ratings'
    ) THEN
        -- إضافة foreign key constraint لـ user_id إذا لم يكن موجوداً
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ratings' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE ratings ADD CONSTRAINT fk_ratings_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- التحقق من وجود foreign key constraint لـ restaurant_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ratings_restaurant_id' AND table_name = 'ratings'
    ) THEN
        -- إضافة foreign key constraint لـ restaurant_id إذا لم يكن موجوداً
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ratings' AND column_name = 'restaurant_id'
        ) THEN
            ALTER TABLE ratings ADD CONSTRAINT fk_ratings_restaurant_id 
            FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- إضافة constraint للتأكد من أن التقييم يحتوي على restaurant_id أو product_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ratings_restaurant_or_product_check'
    ) THEN
        ALTER TABLE ratings ADD CONSTRAINT ratings_restaurant_or_product_check 
        CHECK (
            (restaurant_id IS NOT NULL AND product_id IS NULL) OR 
            (restaurant_id IS NULL AND product_id IS NOT NULL)
        );
    END IF;
END $$;

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant_id ON ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_product_id ON ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

