import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gọn enum trạng thái đơn về 9 giá trị. Các trạng thái cũ được map sang trạng thái
 * mới gần nhất trong vòng đời (xem LEGACY_ORDER_STATUS_MAP trong order-status.enum.ts).
 * Cột `status` là varchar(30) nên không cần sửa kiểu, chỉ cần cập nhật dữ liệu.
 */
export class CollapseOrderStatuses1738100300000 implements MigrationInterface {
  name = 'CollapseOrderStatuses1738100300000';

  private readonly mapping: Array<[string, string]> = [
    ['NEW', 'PENDING_PAYMENT'],
    ['PROCESSING', 'CONFIRMED'],
    ['READY_TO_GO', 'PACKED'],
    ['AT_CARRIER_FACILITY', 'IN_TRANSIT'],
    ['DELIVERING', 'IN_TRANSIT'],
    ['ARRIVED_IN_COUNTRY', 'IN_TRANSIT'],
    ['AT_LOCAL_FACILITY', 'IN_TRANSIT'],
    ['OUT_FOR_DELIVERY', 'IN_TRANSIT'],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [from, to] of this.mapping) {
      await queryRunner.query(
        `UPDATE "orders" SET "status" = $1 WHERE "status" = $2`,
        [to, from],
      );
    }

    // tracking_history lưu from_status/to_status dạng jsonb — remap luôn để lịch sử
    // không hiển thị trạng thái đã bị bỏ.
    for (const [from, to] of this.mapping) {
      await queryRunner.query(
        `UPDATE "orders"
         SET "tracking_history" = REPLACE("tracking_history"::text, $1, $2)::jsonb
         WHERE "tracking_history"::text LIKE $3`,
        [`"${from}"`, `"${to}"`, `%"${from}"%`],
      );
    }
  }

  public async down(): Promise<void> {
    // Không đảo ngược được: nhiều trạng thái cũ gộp về một trạng thái mới.
  }
}
