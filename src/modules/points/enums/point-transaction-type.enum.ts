export enum PointTransactionType {
  /** Điểm tích lũy khi đơn hàng hoàn tất (DELIVERED). */
  EARN = 'EARN',
  /** Hoàn/trừ điểm khi đơn bị huỷ hoặc hoàn tiền (CANCELLED/REFUNDED). */
  REVERSE = 'REVERSE',
}
