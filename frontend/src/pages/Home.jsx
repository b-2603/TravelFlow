import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FavoriteButton from '../components/FavoriteButton';
import DateInput from '../components/DateInput';
import { useTours } from '../hooks/useTours';
import { formatCurrency } from '../utils/formatters';

const slides = [
  {
    eyebrow: 'Mùa hè mở lối',
    title: 'Chạm vào những hành trình đẹp như postcard, nhưng sống động hơn rất nhiều',
    text: 'Từ biển xanh, đảo nắng đến các chuyến city break nhiều năng lượng, TravelFlow biến việc chọn tour thành một trải nghiệm có cảm xúc.',
    image: 'https://images.unsplash.com/photo-1559592481-74153c49ca83?auto=format&fit=crop&w=1600&q=80',
  },
  {
    eyebrow: 'Đi thật nhẹ',
    title: 'Lịch khởi hành rõ ràng, giá minh bạch, thao tác đặt tour mượt trên mọi thiết bị',
    text: 'Tìm nhanh tour phù hợp, chạm để yêu thích, so sánh và chốt hành trình chỉ sau vài phút.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80',
  },
];

const destinations = [
  {
    name: 'Đà Nẵng',
    caption: 'Biển, thành phố và nhịp sống hiện đại.',
    image: 'https://images.unsplash.com/photo-1559592481-74153c49ca83?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Phú Quốc',
    caption: 'Hoàng hôn vàng, resort và các chuyến nghỉ dưỡng sang.',
    image: 'https://images.unsplash.com/photo-1589779137213-95ece3820a2d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Đà Lạt',
    caption: 'Sáng lạnh, thông xanh và quán cà phê trên đồi.',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hạ Long',
    caption: 'Du thuyền, vịnh xanh và những khối đá kỳ vĩ.',
    image: 'https://images.unsplash.com/photo-1506973035872-a4db5eb0d8c2?auto=format&fit=crop&w=1200&q=80',
  },
];

const testimonials = [
  {
    name: 'Linh Nguyễn',
    role: 'Khách du lịch gia đình',
    quote: 'Tôi lọc tour theo ngày đi và số khách rất nhanh, giao diện rõ ràng nên chọn tour dễ hơn hẳn.',
    rating: 5,
  },
  {
    name: 'Huy Trần',
    role: 'Traveller trẻ',
    quote: 'Mỗi card tour hiển thị đủ thông tin cần thiết, xem giá và lịch khởi hành rất trực quan.',
    rating: 5,
  },
  {
    name: 'Diễm Quỳnh',
    role: 'Khách nghỉ dưỡng',
    quote: 'Tôi thích phần yêu thích tour, lưu lại rồi quay lại so sánh rất tiện khi chưa quyết định ngay.',
    rating: 4,
  },
  {
    name: 'Minh Trang',
    role: 'Khách đi cùng trẻ nhỏ',
    quote: 'Phần mô tả tour và lịch trình chi tiết giúp tôi yên tâm hơn khi chọn tour cho cả gia đình.',
    rating: 5,
  },
  {
    name: 'Quốc Bảo',
    role: 'Khách công tác kết hợp du lịch',
    quote: 'Tôi cần lọc tour nhanh, xem được giá và điểm đến ngay mà không phải mở quá nhiều màn hình.',
    rating: 5,
  },
  {
    name: 'Thu Hà',
    role: 'Khách thích nghỉ dưỡng',
    quote: 'Trang có cảm giác hiện đại, nội dung rõ ràng, nhìn vào là biết tour nào phù hợp với mình.',
    rating: 5,
  },
];

function HeroSearch({ filters, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="row g-3 align-items-end tf-glass-panel rounded-5 p-3 p-lg-4 mt-4">
      <div className="col-md-4">
        <label className="form-label fw-semibold">Điểm đến</label>
        <input
          className="form-control form-control-lg rounded-pill"
          placeholder="Ví dụ: Đà Nẵng"
          value={filters.destination}
          onChange={(event) => onChange('destination', event.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label fw-semibold">Ngày khởi hành</label>
        <DateInput
          className="form-control form-control-lg rounded-pill"
          value={filters.date}
          onChange={(value) => onChange('date', value)}
        />
      </div>
      <div className="col-md-2">
        <label className="form-label fw-semibold">Số khách</label>
        <input
          type="number"
          min="1"
          className="form-control form-control-lg rounded-pill"
          value={filters.pax}
          onChange={(event) => onChange('pax', event.target.value)}
        />
      </div>
      <div className="col-md-2 d-grid">
        <button type="submit" className="btn btn-primary btn-lg rounded-pill">
          Tìm tour
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ destination: '', date: '', pax: 2 });
  const { data: toursPayload = { items: [], pagination: null }, isLoading, isError } = useTours({});
  const featuredTours = (toursPayload?.items || []).slice(0, 6);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (filters.destination) params.set('destination', filters.destination);
    if (filters.date) params.set('date', filters.date);
    if (filters.pax) params.set('pax', String(filters.pax));
    navigate(`/tours?${params.toString()}`);
  };

  return (
    <div className="container tf-page-section">
      <section className="mb-5">
        <div id="homeHeroCarousel" className="carousel slide tf-hero-card" data-bs-ride="carousel">
          <div className="carousel-inner">
            {slides.map((slide, index) => (
              <div key={slide.title} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                <div
                  className="position-relative tf-home-hero-slide"
                  style={{
                    backgroundImage: `linear-gradient(115deg, rgba(8, 27, 46, 0.82), rgba(8, 27, 46, 0.28)), url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="position-absolute top-0 start-0 w-100 h-100 tf-subtle-grid opacity-25" />
                  <div className="position-relative px-4 px-lg-5 py-5 d-flex align-items-center min-vh-50">
                    <div className="col-xl-7 text-white py-lg-4">
                      <span className="badge rounded-pill text-bg-warning text-dark px-3 py-2 mb-3">{slide.eyebrow}</span>
                      <h1 className="display-4 fw-bold mb-3">{slide.title}</h1>
                      <p className="lead text-white-50 mb-4">{slide.text}</p>
                      <div className="d-flex flex-wrap gap-3">
                        <Link to="/tours" className="btn btn-light btn-lg rounded-pill px-4">
                          Xem tour đang mở
                        </Link>
                        <Link to="/tours" className="btn btn-outline-light btn-lg rounded-pill px-4">
                          Khám phá điểm đến
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-control-prev" type="button" data-bs-target="#homeHeroCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Trước</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#homeHeroCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Sau</span>
          </button>
        </div>

        <HeroSearch
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          onSubmit={handleSearch}
        />
      </section>

      <section className="mb-5">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
          <div>
            <div className="text-uppercase small fw-bold text-primary mb-2">Tour nổi bật</div>
            <h2 className="display-6 fw-bold mb-2">Những hành trình đang được quan tâm nhất</h2>
            <p className="text-muted mb-0">Hover để cảm nhận chiều sâu hình ảnh, lưu nhanh bằng nút trái tim và xem ưu đãi đang nhấp nháy.</p>
          </div>
          <Link to="/tours" className="btn btn-outline-dark rounded-pill px-4 align-self-start">
            Xem tất cả tour
          </Link>
        </div>

        {isLoading ? (
          <div className="row g-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="col-md-6 col-xl-4" key={index}>
                <div className="placeholder-glow tf-tour-card p-3">
                  <div className="placeholder rounded-4 w-100" style={{ height: '15rem' }} />
                  <div className="placeholder col-8 mt-3" />
                  <div className="placeholder col-6 mt-2" />
                  <div className="placeholder col-4 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="alert alert-warning tf-glass-panel rounded-4">Không thể tải danh sách tour nổi bật.</div>
        ) : (
          <div className="row g-4">
            {featuredTours.map((tour, index) => (
              <div className="col-md-6 col-xl-4" key={tour.id}>
                <Link to={`/tours/${tour.slug}`} className="text-decoration-none text-reset d-block">
                  <article className="tf-tour-card h-100">
                    <div className="tf-card-media" style={{ height: '17rem' }}>
                      <img src={tour.images?.[0] || 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80'} alt={tour.title} />
                      <div className="tf-card-overlay" />
                      <span className="tf-glow-badge">{index < 2 ? 'Ưu đãi hot' : 'Đang hút khách'}</span>
                      <FavoriteButton tourId={tour.id} />
                      <div className="position-absolute bottom-0 start-0 w-100 p-4 text-white">
                        <div className="small text-uppercase opacity-75 mb-2">{tour.category || 'Du lịch trải nghiệm'}</div>
                        <h3 className="h4 fw-bold mb-1">{tour.title}</h3>
                        <div className="d-flex flex-wrap gap-2 small text-white-50">
                          <span>{tour.destination}</span>
                          <span>•</span>
                          <span>{tour.duration_days} ngày</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {(tour.highlights || []).slice(0, 3).map((item) => (
                          <span key={item} className="tf-chip small">{item}</span>
                        ))}
                      </div>

                      <div className="d-flex justify-content-between align-items-end gap-3">
                        <div>
                          <div className="small text-muted">Từ</div>
                          <div className="fs-4 fw-bold text-primary">{formatCurrency(tour.price_per_person)}</div>
                        </div>
                        <span className="btn btn-dark rounded-pill px-3">Xem chi tiết</span>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-end gap-3 mb-4">
          <div>
            <div className="text-uppercase small fw-bold text-primary mb-2">Điểm đến</div>
            <h2 className="display-6 fw-bold mb-0">Những nơi đáng ghé trong mùa này</h2>
          </div>
        </div>

        <div className="row g-4">
          {destinations.map((destination) => (
            <div className="col-sm-6 col-xl-3" key={destination.name}>
              <article className="tf-destination-card h-100">
                <div className="tf-card-media position-relative" style={{ height: '20rem' }}>
                  <img src={destination.image} alt={destination.name} />
                  <div className="tf-card-overlay" />
                  <button type="button" className="tf-heart-btn" aria-label={`Yêu thích ${destination.name}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s-7.2-4.35-9.2-8.72C1.28 8.91 3.2 5 7.2 5c2.1 0 3.6 1.15 4.8 2.63C13.2 6.15 14.7 5 16.8 5c4 0 5.92 3.91 4.4 7.28C19.2 16.65 12 21 12 21Z" />
                    </svg>
                  </button>
                  <div className="position-absolute bottom-0 start-0 w-100 p-4 text-white">
                    <h3 className="h4 fw-bold mb-1">{destination.name}</h3>
                    <p className="mb-0 text-white-50">{destination.caption}</p>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <div className="tf-glass-panel rounded-5 p-4 p-lg-5">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
            <div className="col-lg-5">
              <div className="text-uppercase small fw-bold text-primary mb-2">Khách hàng nói gì</div>
              <h2 className="display-6 fw-bold mb-3">Những phản hồi khiến trải nghiệm đáng tin hơn</h2>
              <p className="text-muted mb-0">
                Phần đánh giá được trình bày gọn, có nhịp, để người xem đọc nhanh và vẫn cảm thấy nội dung thật.
              </p>
            </div>
            <div className="text-lg-end">
              <div className="fw-semibold text-primary">4.9/5 trung bình</div>
              <div className="small text-muted">Từ phản hồi của khách đã sử dụng hệ thống</div>
            </div>
          </div>

          <div className="row g-4">
            {testimonials.map((item, index) => (
              <div className="col-md-6 col-xl-4" key={`${item.name}-${index}`}>
                <article className="rounded-4 border bg-white p-4 h-100 shadow-sm">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="text-warning small fw-semibold">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
                    <span className="badge text-bg-light border text-secondary">Phản hồi thực tế</span>
                  </div>
                  <p className="mb-4 text-secondary">“{item.quote}”</p>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold"
                      style={{ width: 42, height: 42 }}
                    >
                      {item.name
                        .split(' ')
                        .slice(-1)[0]
                        .charAt(0)}
                    </div>
                    <div>
                      <div className="fw-semibold">{item.name}</div>
                      <div className="small text-muted">{item.role}</div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
