-- Migration for Store Hours (Seller Availability)
CREATE TABLE IF NOT EXISTS public.seller_availability (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
    day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_enabled boolean DEFAULT true,
    start_time TIME WITHOUT TIME ZONE DEFAULT '09:00',
    end_time TIME WITHOUT TIME ZONE DEFAULT '18:00',
    UNIQUE(seller_id, day_of_week)
);

ALTER TABLE public.seller_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores podem ver suas próprias horas" 
ON public.seller_availability FOR SELECT USING (true);

CREATE POLICY "Vendedores podem editar suas horas" 
ON public.seller_availability FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.sellers WHERE id = seller_availability.seller_id)
);
