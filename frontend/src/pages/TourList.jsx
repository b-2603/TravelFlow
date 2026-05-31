import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FavoriteButton from '../components/FavoriteButton';
import DateInput from '../components/DateInput';
import { useTours } from '../hooks/useTours';
import { formatCurrency } from '../utils/formatters';

function updateSearchParams(current, updater) {
  const next = new URLSearchParams(current);
  updater(next);
  return next;
}

function TourCard({ tour, index }) {
  const badge = index % 3 === 0 ? 'Ưu đãi' : index % 3 === 1 ? 'Nổi bật' : 'Đáng thử';

  return (
    <Link to={`/tours/${tour.slug}`} className="text-decoration-none text-reset d-block h-100">
      <article className="tf-tour-card tf-tour-card-pro h-100">
        <div className="tf-card-media tf-tour-card-media">
          <img src={tour.images?.[0] || 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80'} alt={tour.title} loading="lazy" />
          <div className="tf-card-overlay" />
          <span className="tf-glow-badge">{badge}</span>
          <FavoriteButton tourId={tour.id} />

          <div className="tf-tour-hero-copy">
            <div className="small text-uppercase opacity-75 mb-2">{tour.category || 'Hành trình tuyển chọn'}</div>
            <h3 className="h4 fw-bold mb-1">{tour.title}</h3>
            <div className="small text-white-50">{tour.destination}</div>
          </div>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div className="d-flex flex-wrap gap-2">
            <span className="tf-chip small">{tour.duration_days} ngày</span>
            <span className="tf-chip small">Tối đa {tour.max_pax} khách</span>
          </div>

          <p className="text-muted small mb-0 tf-tour-desc">
            {tour.description?.slice(0, 115) || 'Lịch trình được tuyển chọn chỉn chu, phù hợp cho những chuyến đi thư giãn và khám phá chất lượng.'}
            {tour.description?.length > 115 ? '...' : ''}
          </p>

          <div className="tf-tour-card-footer mt-auto">
            <div>
              <div className="small text-muted mb-1">Giá từ</div>
              <div className="fs-5 fw-bold text-primary">{formatCurrency(tour.effective_price || tour.price_per_person)}</div>
            </div>
            <span className="btn btn-dark rounded-pill px-3">Xem chi tiết</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function TourList() {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState(params.get('sort') || 'latest');

  const filters = {
    q: params.get('q') || '',
    destination: params.get('destination') || '',
    category: params.get('category') || '',
    date: params.get('date') || '',
    pax: params.get('pax') || '',
    price_min: params.get('price_min') || '',
    price_max: params.get('price_max') || '',
    duration_min: params.get('duration_min') || '',
    duration_max: params.get('duration_max') || '',
    page: params.get('page') || '1',
    per_page: 9,
    sort,
  };

  const { data: payload = { items: [], pagination: null }, isLoading, isError } = useTours(filters);
  const visibleTours = payload?.items || [];
  const pagination = payload?.pagination || null;

  const setParam = (key, value) => {
    setParams(updateSearchParams(params, (next) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete('page');
    }));
  };

  const resetFilters = () => setParams(new URLSearchParams({ sort }));

  const handleSortChange = (value) => {
    setSort(value);
    setParams(updateSearchParams(params, (next) => {
      next.set('sort', value);
      next.delete('page');
    }));
  };

  const goToPage = (page) => {
    setParams(updateSearchParams(params, (next) => next.set('page', String(page))));
  };

  return (
    <div className="container tf-page-section">
      <section className="py-2 py-lg-3">
        <div className="tf-tour-shell">
          <div className="tf-glass-panel tf-tour-topbar">
            <div className="row g-4 align-items-end">
              <div className="col-lg-8">
                <div className="small fw-bold text-uppercase text-primary mb-2">Danh sách tour</div>
                <h1 className="display-5 fw-bold mb-3">Khám phá hành trình theo phong cách chuyên nghiệp hơn</h1>
                <p className="text-muted mb-0">
                  Bộ lọc nằm ngang phía trên để thao tác nhanh, còn danh sách bên dưới hiển thị 3 tour mỗi hàng trên desktop cho bố cục cân đối hơn.
                </p>
              </div>

              <div className="col-lg-4">
                <label className="form-label fw-semibold">Sắp xếp</label>
                <select className="form-select rounded-pill tf-sort-select" value={sort} onChange={(e) => handleSortChange(e.target.value)}>
                  <option value="latest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="popular">Phổ biến</option>
                </select>
              </div>
            </div>

            {!isLoading && !isError && (
              <div className="tf-tour-stats mt-4">
                <div className="tf-tour-stat">
                  <span>Tổng tour phù hợp</span>
                  <strong>{pagination?.total || visibleTours.length}</strong>
                </div>
                <div className="tf-tour-stat">
                  <span>Đang hiển thị</span>
                  <strong>{visibleTours.length}</strong>
                </div>
                <div className="tf-tour-stat">
                  <span>Trang hiện tại</span>
                  <strong>{pagination?.current_page || 1}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="tf-glass-panel tf-filter-bar">
            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
              <div>
                <div className="small fw-bold text-uppercase text-primary mb-1">Bộ lọc nhanh</div>
                <div className="text-muted small mb-0">Tinh chỉnh kết quả ngay trên một hàng ngang, gọn và dễ quan sát hơn.</div>
              </div>

              <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={resetFilters}>
                Xóa nhanh
              </button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6 col-xl">
                <label className="form-label fw-semibold">Từ khóa</label>
                <input
                  className="form-control rounded-pill"
                  value={filters.q}
                  onChange={(e) => setParam('q', e.target.value)}
                  placeholder="Tên tour, trải nghiệm..."
                />
              </div>

              <div className="col-12 col-md-6 col-xl">
                <label className="form-label fw-semibold">Điểm đến</label>
                <input
                  className="form-control rounded-pill"
                  value={filters.destination}
                  onChange={(e) => setParam('destination', e.target.value)}
                  placeholder="Ví dụ: Phú Quốc"
                />
              </div>

              <div className="col-12 col-md-6 col-xl">
                <label className="form-label fw-semibold">Danh mục</label>
                <select className="form-select rounded-pill" value={filters.category} onChange={(e) => setParam('category', e.target.value)}>
                  <option value="">Tất cả danh mục</option>
                  <option value="Biển đảo">Biển đảo</option>
                  <option value="Nghỉ dưỡng">Nghỉ dưỡng</option>
                  <option value="Trải nghiệm">Trải nghiệm</option>
                  <option value="Gia đình">Gia đình</option>
                </select>
              </div>

              <div className="col-6 col-md-3 col-xl">
                <label className="form-label fw-semibold">Ngày đi</label>
                <DateInput
                  className="form-control rounded-pill"
                  value={filters.date}
                  onChange={(value) => setParam('date', value)}
                />
              </div>

              <div className="col-6 col-md-3 col-xl">
                <label className="form-label fw-semibold">Số khách</label>
                <input type="number" min="1" className="form-control rounded-pill" value={filters.pax} onChange={(e) => setParam('pax', e.target.value)} />
              </div>

              <div className="col-6 col-md-3 col-xl">
                <label className="form-label fw-semibold">Giá từ</label>
                <input type="number" min="0" className="form-control rounded-pill" value={filters.price_min} onChange={(e) => setParam('price_min', e.target.value)} />
              </div>

              <div className="col-6 col-md-3 col-xl">
                <label className="form-label fw-semibold">Giá đến</label>
                <input type="number" min="0" className="form-control rounded-pill" value={filters.price_max} onChange={(e) => setParam('price_max', e.target.value)} />
              </div>

              <div className="col-6 col-md-3 col-xl">
                <label className="form-label fw-semibold">Ngày tối thiểu</label>
                <input type="number" min="1" className="form-control rounded-pill" value={filters.duration_min} onChange={(e) => setParam('duration_min', e.target.value)} />
              </div>

              <div className="col-6 col-md-3 col-xl">
                <label className="form-label fw-semibold">Ngày tối đa</label>
                <input type="number" min="1" className="form-control rounded-pill" value={filters.duration_max} onChange={(e) => setParam('duration_max', e.target.value)} />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="row g-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="col-md-6 col-xl-4" key={index}>
                  <div className="tf-tour-card p-3">
                    <div className="placeholder-glow">
                      <div className="placeholder rounded-4 w-100" style={{ height: '18rem' }} />
                      <div className="placeholder col-8 mt-3" />
                      <div className="placeholder col-6 mt-2" />
                      <div className="placeholder col-4 mt-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="alert alert-warning tf-glass-panel rounded-4">Không thể tải danh sách tour lúc này.</div>
          ) : visibleTours.length === 0 ? (
            <div className="tf-glass-panel rounded-5 p-5 text-center">
              <h2 className="h4 mb-2">Chưa tìm thấy tour phù hợp</h2>
              <p className="text-muted mb-4">Thử nới phạm vi giá, đổi điểm đến hoặc bỏ bớt điều kiện lọc để xem thêm hành trình.</p>
              <button type="button" className="btn btn-primary rounded-pill px-4" onClick={resetFilters}>
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {visibleTours.map((tour, index) => (
                  <div className="col-md-6 col-xl-4" key={tour.id}>
                    <TourCard tour={tour} index={index} />
                  </div>
                ))}
              </div>

              {pagination && pagination.last_page > 1 && (
                <nav className="mt-4 mt-lg-5">
                  <ul className="pagination tf-tour-pagination justify-content-center mb-0 flex-wrap">
                    <li className={`page-item ${Number(pagination.current_page) <= 1 ? 'disabled' : ''}`}>
                      <button type="button" className="page-link rounded-pill mx-1 border-0 shadow-sm" onClick={() => goToPage(Number(pagination.current_page) - 1)}>
                        Trước
                      </button>
                    </li>

                    {Array.from({ length: pagination.last_page }).map((_, index) => {
                      const page = index + 1;
                      const active = Number(pagination.current_page) === page;

                      return (
                        <li key={page} className={`page-item ${active ? 'active' : ''}`}>
                          <button type="button" className="page-link rounded-pill mx-1 border-0 shadow-sm" onClick={() => goToPage(page)}>
                            {page}
                          </button>
                        </li>
                      );
                    })}

                    <li className={`page-item ${Number(pagination.current_page) >= Number(pagination.last_page) ? 'disabled' : ''}`}>
                      <button type="button" className="page-link rounded-pill mx-1 border-0 shadow-sm" onClick={() => goToPage(Number(pagination.current_page) + 1)}>
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
