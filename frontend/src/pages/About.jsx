import { Link } from 'react-router-dom';

const values = [
  {
    title: 'Tập trung vào trải nghiệm',
    text: 'Mỗi màn hình được thiết kế để người dùng tìm tour, đặt tour và theo dõi trạng thái một cách rõ ràng, ít bước và ít nhiễu.',
  },
  {
    title: 'Vận hành minh bạch',
    text: 'Hệ thống phân tách rõ vai trò giữa khách hàng, tư vấn, quản lý tour, điều phối, hướng dẫn viên và kế toán để xử lý công việc mạch lạc.',
  },
  {
    title: 'Mở rộng có kiểm soát',
    text: 'Cấu trúc hiện tại cho phép bổ sung tính năng mới mà vẫn giữ được sự ổn định cho dữ liệu, quy trình và giao diện.',
  },
];

const milestones = [
  'Xây dựng nền tảng quản lý tour với các luồng đặt chỗ, duyệt tour và phân công hướng dẫn viên.',
  'Tối ưu giao diện công cộng để khách hàng dễ xem danh sách tour, chi tiết tour và các lựa chọn liên quan.',
  'Chuẩn hóa vai trò vận hành cho từng bộ phận trong hệ thống để hỗ trợ mở rộng lâu dài.',
];

const founders = [
  {
    name: 'Tống Hiểu Khiêm',
    role: 'Người sáng tạo và đồng sáng lập',
    image: '/team/z7888491150805_b32334430086c047bb1ac546e1c0be52.jpg',
    description:
      'Định hướng tổng thể cho sản phẩm, tập trung vào cấu trúc trải nghiệm người dùng, ý tưởng giao diện và sự rõ ràng trong quy trình sử dụng.',
  },
  {
    name: 'Nguyễn Trần Thái Bảo',
    role: 'Người sáng tạo và đồng sáng lập',
    image: '/team/z7888484886711_4ae01bcac1ad035dbb6a5fe5c938ed20.jpg',
    description:
      'Phụ trách phát triển ý tưởng hệ thống, phối hợp hoàn thiện luồng vận hành và đảm bảo nền tảng đáp ứng nhu cầu thực tế của các vai trò trong dự án.',
  },
];

export default function About() {
  return (
    <div className="container tf-page-section">
      <section className="tf-hero-card p-4 p-lg-5 mb-5">
        <div className="row align-items-center g-4">
          <div className="col-lg-7">
            <span className="badge rounded-pill text-bg-primary px-3 py-2 mb-3">Giới thiệu về chúng tôi</span>
            <h1 className="display-5 fw-bold mb-3">TravelFlow là nền tảng du lịch được xây dựng để làm cho việc đặt và vận hành tour trở nên gọn hơn.</h1>
            <p className="lead text-secondary mb-4">
              Chúng tôi tạo ra hệ thống này với mục tiêu kết nối khách hàng, tư vấn viên, quản lý tour, hướng dẫn viên, đối tác dịch vụ và bộ phận kế toán trong cùng một luồng làm việc thống nhất.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/tours" className="btn btn-primary btn-lg rounded-pill px-4">
                Khám phá tour
              </Link>
              <Link to="/" className="btn btn-outline-dark btn-lg rounded-pill px-4">
                Về trang chủ
              </Link>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="tf-glass-panel rounded-5 p-4 p-lg-4">
              <div className="row g-3">
                <div className="col-6">
                  <div className="rounded-4 bg-white p-3 shadow-sm h-100">
                    <div className="small text-muted">Mục tiêu</div>
                    <div className="fw-bold fs-4 text-primary">Trải nghiệm mượt</div>
                    <div className="small">Đơn giản hóa thao tác tìm kiếm và đặt tour.</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="rounded-4 bg-white p-3 shadow-sm h-100">
                    <div className="small text-muted">Trọng tâm</div>
                    <div className="fw-bold fs-4 text-primary">Quy trình rõ</div>
                    <div className="small">Tách vai trò và luồng xử lý theo từng bộ phận.</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="rounded-4 bg-white p-3 shadow-sm">
                    <div className="small text-muted">Giá trị cốt lõi</div>
                    <div className="fw-bold fs-5">Đặt tour nhanh, quản lý đúng, thông tin minh bạch</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <div className="row g-4">
          {values.map((item) => (
            <div className="col-md-4" key={item.title}>
              <article className="tf-tour-card h-100 p-4">
                <div className="badge text-bg-light border text-primary rounded-pill mb-3">Giá trị</div>
                <h2 className="h4 fw-bold mb-3">{item.title}</h2>
                <p className="text-secondary mb-0">{item.text}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <div className="row g-4 align-items-start">
          <div className="col-lg-6">
            <div className="tf-glass-panel rounded-5 p-4 p-lg-5 h-100">
              <div className="text-uppercase small fw-bold text-primary mb-2">Hành trình phát triển</div>
              <h2 className="display-6 fw-bold mb-4">Chúng tôi xây dựng TravelFlow theo hướng thực dụng và có thể mở rộng.</h2>
              <div className="d-grid gap-3">
                {milestones.map((item, index) => (
                  <div className="d-flex gap-3" key={item}>
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                      style={{ width: 36, height: 36 }}
                    >
                      {index + 1}
                    </div>
                    <p className="mb-0 text-secondary pt-1">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="tf-tour-card p-4 p-lg-5 h-100">
              <div className="text-uppercase small fw-bold text-primary mb-2">Người sáng tạo</div>
              <h2 className="display-6 fw-bold mb-4">Hai người đồng hành tạo nên dự án</h2>
              <div className="d-grid gap-4">
                {founders.map((founder) => (
                  <div className="d-flex align-items-start gap-3" key={founder.name}>
                    <img
                      src={founder.image}
                      alt={founder.name}
                      className="rounded-circle flex-shrink-0 object-fit-cover border border-3 border-white shadow-sm"
                      width="72"
                      height="72"
                      style={{ objectFit: 'cover' }}
                      onError={(event) => {
                        event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&background=0a5c86&color=fff&size=128`;
                      }}
                    />
                    <div>
                      <div className="fw-bold fs-5">{founder.name}</div>
                      <div className="small text-primary fw-semibold mb-2">{founder.role}</div>
                      <p className="text-secondary mb-0">{founder.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <div className="tf-glass-panel rounded-5 p-4 p-lg-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="text-uppercase small fw-bold text-primary mb-2">Sứ mệnh</div>
              <h2 className="display-6 fw-bold mb-3">Mang lại một nền tảng du lịch dễ dùng cho khách, dễ vận hành cho đội ngũ.</h2>
              <p className="text-secondary mb-0">
                TravelFlow không chỉ là một website đặt tour, mà còn là hệ thống hỗ trợ công việc cho toàn bộ quy trình phía sau chuyến đi.
                Từ lúc khách hàng khám phá tour đến khi kế toán đối soát thanh toán, mọi bước đều được thiết kế để rõ ràng và có thể theo dõi.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/register" className="btn btn-primary btn-lg rounded-pill px-4">
                Tạo tài khoản
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
