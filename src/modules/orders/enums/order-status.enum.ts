/**
 * Trạng thái đơn hàng — khai báo đúng theo thứ tự vòng đời.
 * Thứ tự khai báo là thứ tự hiển thị ở admin/storefront, đừng sắp xếp lại tuỳ tiện.
 */
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

/**
 * Map trạng thái cũ (đã bỏ) -> trạng thái mới, dùng cho migration dữ liệu
 * và để đọc được đơn cũ chưa migrate.
 */
export const LEGACY_ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  NEW: OrderStatus.PENDING_PAYMENT,
  PROCESSING: OrderStatus.CONFIRMED,
  READY_TO_GO: OrderStatus.PACKED,
  AT_CARRIER_FACILITY: OrderStatus.IN_TRANSIT,
  DELIVERING: OrderStatus.IN_TRANSIT,
  ARRIVED_IN_COUNTRY: OrderStatus.IN_TRANSIT,
  AT_LOCAL_FACILITY: OrderStatus.IN_TRANSIT,
  OUT_FOR_DELIVERY: OrderStatus.IN_TRANSIT,
};
