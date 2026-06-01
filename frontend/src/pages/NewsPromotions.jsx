import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsPromotionAPI } from '../services/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NewsPromotions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const fallbackCover = 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1600&q=80';

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await newsPromotionAPI.list(filter === 'all' ? {} : { type: filter });
        const payload = response?.data?.data ?? response?.data ?? {};
        if (active) setItems(payload.items || []);
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Không thể tải tin tức và ưu đãi.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <div className="container tf-page-section">
      <section className="tf-hero-card p-4 p-lg-5 mb-5">
        <div className="row align-items-center g-4">
          <div className="col-lg-12">
            <span className="badge rounded-pill text-bg-primary px-3 py-2 mb-3">Tin tức & ưu đãi</span>
            <h1 className="display-5 fw-bold mb-3">Tin mới, chương trình sale và ưu đãi đang mở.</h1>
            <p className="lead text-secondary mb-4">
              Tập hợp tin tức du lịch, chương trình khuyến mãi và ưu đãi đang áp dụng trên TravelFlow. Bạn có thể xem
              nhanh nội dung mới nhất ngay tại đây trước khi chọn tour phù hợp.
            </p>
            <Link to="/tours" className="btn btn-outline-dark btn-lg rounded-pill px-4">
              Xem tour
            </Link>
          </div>
        </div>
      </section>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'news', label: 'Tin tức' },
          { key: 'promotion', label: 'Ưu đãi' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn rounded-pill px-4 ${filter === tab.key ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="alert alert-light border rounded-4">Đang tải nội dung...</div>
      ) : error ? (
        <div className="alert alert-danger rounded-4">{error}</div>
      ) : (
        <div className="row g-4">
          {items.map((item) => (
            <div className="col-md-6 col-xl-4" key={item.id}>
              <article className="tf-tour-card h-100 overflow-hidden">
                <div className="tf-card-media position-relative" style={{ height: '14rem' }}>
                  <img
                    src={item.cover_image || fallbackCover}
                    alt={item.title}
                    onError={(e) => {
                      if (e.currentTarget.src !== fallbackCover) {
                        e.currentTarget.src = fallbackCover;
                      }
                    }}
                  />
                  <div className="tf-card-overlay" />
                </div>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <span className={`badge rounded-pill ${item.type === 'promotion' ? 'text-bg-warning' : 'text-bg-info'}`}>
                      {item.type === 'promotion' ? 'Ưu đãi' : 'Tin tức'}
                    </span>
                    <span className="small text-muted">{formatDate(item.published_at || item.created_at)}</span>
                  </div>
                  <h2 className="h4 fw-bold mb-2">{item.title}</h2>
                  <p className="text-secondary mb-3">{item.summary}</p>
                  <Link to={`/news-promotions/${item.id}`} className="btn btn-outline-primary btn-sm rounded-pill px-3 mb-3">
                    Xem chi tiết
                  </Link>
                  <div className="d-flex flex-wrap gap-2 small text-muted">
                    <span>{item.tag}</span>
                    <span>•</span>
                    <span>{item.author?.name || 'TravelFlow'}</span>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
