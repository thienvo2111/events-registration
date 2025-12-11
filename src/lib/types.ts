// ============================================================================
// lib/types.ts - Updated Types (No Auth Required)
// ============================================================================

// ============================================================================
// REGISTRATION & USER TYPES (Không cần Auth)
// ============================================================================

export interface Registration {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  unit_id: string | null;
  created_at: string;
  updated_at: string;
  spec_req?: string;        // Yêu cầu đặc biệt
  note?: string;            // Ghi chú
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ACTIVITIES & EVENTS
// ============================================================================

export interface Activity {
  id: string;
  title: string;
  description?: string | null;
  price_member: number | null;
  price_non_member: number | null;
  max_participants?: number | null;
  current_participants?: number | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  image_url?: string;
  created_at: string;
  updated_at?: string | null;
}

export interface ActivityStats {
  id: string;
  title: string;
  price_member: number;
  price_non_member: number;
  max_participants?: number;
  registrations: number;
  total_quantity: number;
  status: 'active' | 'inactive' | 'cancelled';
}

// ============================================================================
// ORDERS & PAYMENTS
// ============================================================================

export interface Order {
  id: string;
  order_code: string;
  registration_id: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  qr_code_string?: string;
  qr_code_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  activity_id: string;
  quantity: number;
  price_per_unit: number;
  subtotal: number;
  created_at: string;
}

export interface Attendee {
  id: string;
  order_id: string;
  activity_id: string;
  full_name: string;
  phone_number: string;
  unit_id?: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
}

export interface OrderSummary {
  order_id: string;
  order_code: string;
  full_name: string;
  email?: string;
  phone_number: string;
  unit_name?: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  item_count: number;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  order_id: string;
  previous_status?: string;
  new_status: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardOrder {
  id: string;
  order_code: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  registration?: {
    full_name: string;
    spec_req: string;
    note: string;
  } | null;
}

export interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  recentOrders: DashboardOrder[];
}

// ============================================================================
// CART & CHECKOUT
// ============================================================================

export interface CartItem {
  activityId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  pricingType: PricingType;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

export interface CheckoutData {
  registration: RegistrationFormData;
  attendee_details: AttendeeDetail[];
  activities: Array<{
    activity_id: string;
    quantity: number;
  }>;
  total_amount: number;
}

// ============================================================================
// PAYMENT (VIETQR)
// ============================================================================

export interface VietQRPayload {
  bank_code: string;
  account_number: string;
  amount: number;
  description: string;
  beneficiary_name: string;
}

export interface QRCodeData {
  qr_string: string;
  qr_url?: string;
  bank_code: string;
  account_number: string;
  amount: number;
  description: string;
}

// ============================================================================
// FORMS
// ============================================================================

export interface RegistrationFormData {
  full_name: string;
  phone_number: string;
  email?: string;
  unit_id: string;
}

export interface AttendeeDetail {
  full_name: string;
  phone_number: string;
  email?: string;
}

export interface SearchOrderFormData {
  search_by: 'order_code' | 'phone_number';
  value: string;
}

// ============================================================================
// SEARCH & LOOKUP
// ============================================================================

export interface OrderSearchResult {
  order_id: string;
  order_code: string;
  full_name: string;
  phone_number: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  item_count: number;
  items?: {
    activity_title: string;
    quantity: number;
    price_per_unit: number;
  }[];
  attendees?: Attendee[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// ============================================================================
// ADMIN
// ============================================================================

export interface AdminStats {
  total_activities: number;
  total_orders: number;
  total_revenue: number;
  pending_payments: number;
  total_registrations: number;
  completed_orders: number;
}

export interface AdminDashboardData {
  stats: AdminStats;
  recent_orders: OrderSummary[];
  activity_stats: ActivityStats[];
  top_activities: Activity[];
}

// ============================================================================
// PUBLIC ATTENDEES
// ============================================================================

export interface PublicAttendee {
  full_name: string;
  unit_name?: string;
  activity_name: string;
  created_at: string;
}

export type PricingType = 'member' | 'non_member';
