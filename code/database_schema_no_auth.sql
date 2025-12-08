-- ============================================================================
-- Event Registration System - Updated Database Schema (No User Auth Required)
-- Database: PostgreSQL (Supabase)
-- ============================================================================

-- 1. REGISTRATIONS TABLE (Thay thế profiles - lưu thông tin đăng ký)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. UNITS TABLE (Danh sách đơn vị công tác)
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ACTIVITIES TABLE (Hoạt động/Sự kiện)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  max_participants INT,
  current_participants INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ORDERS TABLE (Đơn hàng)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  qr_code_string TEXT,
  qr_code_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ORDER_ITEMS TABLE (Chi tiết hoạt động trong đơn hàng)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ATTENDEES TABLE (Danh sách người tham gia)
CREATE TABLE IF NOT EXISTS public.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PAYMENT_HISTORY TABLE (Lịch sử thanh toán)
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  verified_by TEXT, -- Admin name (không yêu cầu auth)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations(phone_number);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_unit_id ON public.registrations(unit_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_registration_id ON public.orders(registration_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone_number); -- Tìm kiếm theo SĐT
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_activity_id ON public.order_items(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendees_order_id ON public.attendees(order_id);
CREATE INDEX IF NOT EXISTS idx_attendees_activity_id ON public.attendees(activity_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_order_id ON public.payment_history(order_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Simplified (No Auth)
-- ============================================================================

-- Disable RLS for public access (không cần auth)
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VIEWS (Useful Queries)
-- ============================================================================

-- Order Summary View (Tóm tắt đơn hàng)
CREATE OR REPLACE VIEW public.order_summary AS
SELECT 
  o.id,
  o.order_code,
  r.full_name,
  r.email,
  r.phone_number,
  u.name as unit_name,
  o.total_amount,
  o.payment_status,
  COUNT(oi.id) as item_count,
  o.created_at
FROM public.orders o
JOIN public.registrations r ON o.registration_id = r.id
LEFT JOIN public.units u ON r.unit_id = u.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, r.id, u.id;

-- Activity Statistics View
CREATE OR REPLACE VIEW public.activity_stats AS
SELECT 
  a.id,
  a.title,
  a.price,
  a.max_participants,
  COUNT(DISTINCT oi.order_id) as registrations,
  COALESCE(SUM(oi.quantity), 0) as total_quantity,
  a.status
FROM public.activities a
LEFT JOIN public.order_items oi ON a.id = oi.activity_id
LEFT JOIN public.orders o ON oi.order_id = o.id AND o.payment_status = 'completed'
GROUP BY a.id;

-- Public Attendees View (Danh sách người tham gia công khai)
CREATE OR REPLACE VIEW public.public_attendees AS
SELECT 
  a.full_name,
  a.unit_id,
  u.name as unit_name,
  ac.title as activity_name,
  a.created_at
FROM public.attendees a
LEFT JOIN public.units u ON a.unit_id = u.id
LEFT JOIN public.activities ac ON a.activity_id = ac.id
LEFT JOIN public.orders o ON a.order_id = o.id
WHERE o.payment_status = 'completed'
ORDER BY a.created_at DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Generate unique order code
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function: Update activity participant count
CREATE OR REPLACE FUNCTION public.update_activity_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.activities
  SET current_participants = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM public.order_items
    WHERE activity_id = NEW.activity_id
  )
  WHERE id = NEW.activity_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update participant count
CREATE TRIGGER trigger_update_participants
AFTER INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_activity_participants();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

INSERT INTO public.units (name, description) VALUES
  ('Phòng Chính sách Công tác Sinh viên', 'Student Affairs Department'),
  ('Phòng Đại học', 'University Office'),
  ('Phòng Sau đại học', 'Graduate School Office'),
  ('Khoa Công nghệ Thông tin', 'School of Information Technology'),
  ('Khoa Kinh tế', 'School of Economics')
ON CONFLICT DO NOTHING;

INSERT INTO public.activities (title, description, price, status, location) VALUES
  ('Workshop Python Cơ bản', 'Lập trình Python từ đầu cho người mới bắt đầu', 0, 'active', 'Phòng A101'),
  ('Seminar AI/Machine Learning', 'Khám phá ứng dụng AI trong giáo dục', 50000, 'active', 'Phòng B201'),
  ('Hội thảo Kỹ năng mềm', 'Phát triển kỹ năng giao tiếp và lãnh đạo', 0, 'active', 'Phòng C301'),
  ('Ngày hội Kỹ thuật', 'Trưng bày công nghệ và dự án sinh viên', 0, 'active', 'Sân vận động'),
  ('Khóa tập huấn Tư vấn hướng nghiệp', 'Hướng dẫn chọn ngành và tìm việc', 100000, 'active', 'Phòng D401')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTION: Search Orders by Code or Phone
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_orders(
  p_order_code TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL
)
RETURNS TABLE (
  order_id UUID,
  order_code TEXT,
  full_name TEXT,
  phone_number TEXT,
  total_amount DECIMAL,
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  item_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_code,
    r.full_name,
    r.phone_number,
    o.total_amount,
    o.payment_status,
    o.created_at,
    COUNT(oi.id)::INT
  FROM public.orders o
  JOIN public.registrations r ON o.registration_id = r.id
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  WHERE 
    (p_order_code IS NULL OR o.order_code = p_order_code)
    AND (p_phone_number IS NULL OR r.phone_number = p_phone_number)
  GROUP BY o.id, r.id;
END;
$$ LANGUAGE plpgsql;
