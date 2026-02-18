-- ============================================================
-- السماح لصاحب المطعم (والمستخدمين المصادقين) بقراءة السائقين
-- حتى يظهر في نافذة "Choisir un livreur" السائقون المعتمدون والمتاحون
-- ============================================================
-- Exécuter dans Supabase → SQL Editor si les livreurs ne s'affichent pas
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
    ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

    -- Autoriser la lecture des chauffeurs pour tout utilisateur authentifié
    -- (nécessaire pour que le restaurant puisse assigner un livreur à une commande)
    DROP POLICY IF EXISTS "drivers_select_authenticated" ON public.drivers;
    CREATE POLICY "drivers_select_authenticated" ON public.drivers
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;
