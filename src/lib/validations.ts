import { z } from 'zod';

export const isValidPhoneNumber = (phone: string): boolean => {
  const vietnamPhoneRegex = /^(?:\+84|0)[1-9]\d{8,9}$/;
  return vietnamPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const CheckoutSchema = z.object({
  full_name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  phone_number: z.string().refine(
    (val) => isValidPhoneNumber(val),
    'Số điện thoại không hợp lệ'
  ),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  unit_id: z.string().uuid('Chọn đơn vị công tác'),
  title: z.string().optional(),                          // chức danh
  seat_req: z.enum(['protocol', 'chapter_table']).optional(), // ưu tiên chỗ ngồi
  spec_req: z.string().optional(),                      // yêu cầu đặc biệt
  note: z.string().optional(),                          // ghi chú
});

export const SearchOrderSchema = z.object({
  search_by: z.enum(['order_code', 'phone_number']),
  value: z.string().min(1, 'Nhập thông tin tìm kiếm'),
});

export const ActivitySchema = z.object({
  title: z.string().min(3, 'Tên hoạt động phải ít nhất 3 ký tự'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  max_participants: z.coerce.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export type CheckoutFormInput = z.infer<typeof CheckoutSchema>;
export type SearchOrderFormInput = z.infer<typeof SearchOrderSchema>;
export type ActivityFormInput = z.infer<typeof ActivitySchema>;
