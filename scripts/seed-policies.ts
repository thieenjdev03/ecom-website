import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Policy } from '../src/modules/policies/entities/policy.entity';

// ----------------------------------------------------------------------
// Seed sample "Chính sách và hỗ trợ" (Policies) rows.
//
// NOTE: this uses the raw repository, which BYPASSES PoliciesService — so it does
// NOT auto-generate `slug` and does NOT run backend HTML sanitization. Therefore we
// provide our own `slug` and pre-sanitized HTML `content` (allowed tags only:
// h1-h4, p, ul, ol, li, strong, em, a, blockquote, table, etc.).
//
// Idempotent: skips any policy whose `slug` already exists.
// Run: npm run seed:policies
// ----------------------------------------------------------------------

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Policy],
  synchronize: false,
  logging: true,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

const policiesData: Partial<Policy>[] = [
  {
    title: 'Chính sách đổi trả & hoàn tiền',
    slug: 'chinh-sach-doi-tra-hoan-tien',
    display_order: 1,
    is_active: true,
    content: [
      '<h2>Chính sách đổi trả &amp; hoàn tiền</h2>',
      '<p>Mingo cam kết mang đến những sản phẩm kem chất lượng nhất. Trong trường hợp sản phẩm gặp sự cố, chúng tôi hỗ trợ đổi trả theo các điều kiện dưới đây.</p>',
      '<h3>Điều kiện đổi trả</h3>',
      '<ul>',
      '<li>Sản phẩm bị lỗi do vận chuyển, tan chảy hoặc không đúng mô tả.</li>',
      '<li>Sản phẩm còn nguyên bao bì, chưa qua sử dụng.</li>',
      '<li>Yêu cầu đổi trả trong vòng <strong>24 giờ</strong> kể từ khi nhận hàng.</li>',
      '</ul>',
      '<h3>Quy trình hoàn tiền</h3>',
      '<ol>',
      '<li>Liên hệ hotline <strong>1900 6868</strong> hoặc email <a href="mailto:support@mingo.vn">support@mingo.vn</a>.</li>',
      '<li>Cung cấp mã đơn hàng và hình ảnh sản phẩm lỗi.</li>',
      '<li>Mingo xác nhận và hoàn tiền trong <strong>3–5 ngày làm việc</strong> qua phương thức thanh toán ban đầu.</li>',
      '</ol>',
      '<p><em>Lưu ý: sản phẩm khuyến mãi, giảm giá trên 50% không áp dụng đổi trả.</em></p>',
    ].join(''),
  },
  {
    title: 'Chính sách vận chuyển & giao hàng',
    slug: 'chinh-sach-van-chuyen-giao-hang',
    display_order: 2,
    is_active: true,
    content: [
      '<h2>Chính sách vận chuyển &amp; giao hàng</h2>',
      '<p>Mingo sử dụng thùng giữ lạnh chuyên dụng để đảm bảo kem đến tay bạn vẫn giữ được độ ngon và kết cấu hoàn hảo.</p>',
      '<h3>Khu vực &amp; thời gian giao hàng</h3>',
      '<table>',
      '<thead><tr><th>Khu vực</th><th>Thời gian</th><th>Phí ship</th></tr></thead>',
      '<tbody>',
      '<tr><td>Nội thành TP.HCM</td><td>2–4 giờ</td><td>25.000đ</td></tr>',
      '<tr><td>Các quận ngoại thành</td><td>Trong ngày</td><td>40.000đ</td></tr>',
      '<tr><td>Tỉnh lân cận</td><td>1–2 ngày</td><td>Theo báo giá</td></tr>',
      '</tbody>',
      '</table>',
      '<h3>Miễn phí vận chuyển</h3>',
      '<p>Áp dụng <strong>freeship</strong> cho đơn hàng từ <strong>300.000đ</strong> trong khu vực nội thành.</p>',
      '<p>Vui lòng kiểm tra sản phẩm ngay khi nhận hàng và phản hồi tài xế nếu có bất kỳ vấn đề nào.</p>',
    ].join(''),
  },
  {
    title: 'Chính sách bảo mật thông tin',
    slug: 'chinh-sach-bao-mat-thong-tin',
    display_order: 3,
    is_active: true,
    content: [
      '<h2>Chính sách bảo mật thông tin</h2>',
      '<p>Mingo tôn trọng và cam kết bảo vệ thông tin cá nhân của khách hàng theo quy định pháp luật hiện hành.</p>',
      '<h3>Thông tin chúng tôi thu thập</h3>',
      '<ul>',
      '<li>Họ tên, số điện thoại, địa chỉ giao hàng.</li>',
      '<li>Địa chỉ email và lịch sử đơn hàng.</li>',
      '<li>Thông tin thanh toán (được mã hoá qua cổng thanh toán an toàn).</li>',
      '</ul>',
      '<h3>Mục đích sử dụng</h3>',
      '<p>Thông tin chỉ được dùng để xử lý đơn hàng, chăm sóc khách hàng và gửi ưu đãi (khi bạn đồng ý). Mingo <strong>không chia sẻ</strong> thông tin cho bên thứ ba vì mục đích thương mại.</p>',
      '<blockquote>Bạn có quyền yêu cầu chỉnh sửa hoặc xoá dữ liệu cá nhân bất kỳ lúc nào bằng cách liên hệ bộ phận hỗ trợ.</blockquote>',
    ].join(''),
  },
  {
    title: 'Chính sách thanh toán',
    slug: 'chinh-sach-thanh-toan',
    display_order: 4,
    is_active: true,
    content: [
      '<h2>Chính sách thanh toán</h2>',
      '<p>Mingo hỗ trợ đa dạng phương thức thanh toán, an toàn và tiện lợi.</p>',
      '<ul>',
      '<li><strong>Thanh toán khi nhận hàng (COD)</strong> — áp dụng toàn quốc.</li>',
      '<li><strong>Chuyển khoản ngân hàng</strong> — xác nhận đơn ngay sau khi nhận thanh toán.</li>',
      '<li><strong>Ví điện tử &amp; thẻ</strong> — Momo, VNPay, thẻ ATM/Visa/Mastercard qua cổng bảo mật.</li>',
      '</ul>',
      '<p>Mọi giao dịch trực tuyến đều được mã hoá SSL, đảm bảo an toàn tuyệt đối cho thông tin thẻ của bạn.</p>',
    ].join(''),
  },
  {
    title: 'Điều khoản sử dụng',
    slug: 'dieu-khoan-su-dung',
    display_order: 5,
    is_active: true,
    content: [
      '<h2>Điều khoản sử dụng</h2>',
      '<p>Khi truy cập và mua sắm tại Mingo, bạn đồng ý với các điều khoản dưới đây.</p>',
      '<h3>Quy định chung</h3>',
      '<ul>',
      '<li>Khách hàng cung cấp thông tin chính xác khi đặt hàng.</li>',
      '<li>Không sử dụng website cho mục đích vi phạm pháp luật hoặc gây hại đến hệ thống.</li>',
      '<li>Giá sản phẩm và chương trình khuyến mãi có thể thay đổi mà không cần báo trước.</li>',
      '</ul>',
      '<h3>Quyền sở hữu</h3>',
      '<p>Toàn bộ nội dung, hình ảnh và thương hiệu <strong>Mingo</strong> thuộc quyền sở hữu của chúng tôi và được bảo hộ theo luật sở hữu trí tuệ.</p>',
    ].join(''),
  },
  {
    title: 'Câu hỏi thường gặp (FAQ)',
    slug: 'cau-hoi-thuong-gap',
    display_order: 6,
    is_active: true,
    content: [
      '<h2>Câu hỏi thường gặp</h2>',
      '<h3>Kem để được bao lâu sau khi giao?</h3>',
      '<p>Với thùng giữ lạnh, kem giữ nguyên chất lượng trong <strong>2–3 giờ</strong>. Bạn nên bảo quản ngăn đông ngay khi nhận.</p>',
      '<h3>Tôi có thể đặt bánh kem theo yêu cầu không?</h3>',
      '<p>Có. Vui lòng đặt trước <strong>tối thiểu 48 giờ</strong> và liên hệ hotline để được tư vấn mẫu mã.</p>',
      '<h3>Mingo có chương trình thành viên không?</h3>',
      '<p>Có — tích điểm mỗi đơn hàng và nhận ưu đãi sinh nhật. Đăng ký tài khoản để bắt đầu tích điểm.</p>',
    ].join(''),
  },
];

async function seedPolicies() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const repo = AppDataSource.getRepository(Policy);
    let createdCount = 0;

    for (const data of policiesData) {
      const existing = await repo.findOne({ where: { slug: data.slug } });
      if (existing) {
        console.log(`   ⏭  Skipped (exists): ${data.title}`);
      } else {
        await repo.save(repo.create(data));
        createdCount += 1;
        console.log(`   ✓ Created: ${data.title}`);
      }
    }

    console.log(`\n🎉 Policies seed completed: ${createdCount} created / ${policiesData.length} total\n`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding policies:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seedPolicies();
