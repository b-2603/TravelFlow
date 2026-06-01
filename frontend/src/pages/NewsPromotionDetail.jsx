import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { newsPromotionAPI } from '../services/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function DetailList({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-4">
      <h2 className="h4 fw-bold mb-3">{title}</h2>
      <div className="row g-3">
        {items.map((item, index) => (
          <div className="col-md-6" key={`${title}-${index}`}>
            <div className="border rounded-4 p-3 h-100 bg-white">
              {typeof item === 'string' ? (
                <div className="fw-medium">{item}</div>
              ) : (
                <>
                  <div className="fw-bold mb-2">{item.title || item.question || `Mục ${index + 1}`}</div>
                  <div className="text-secondary" style={{ whiteSpace: 'pre-line' }}>
                    {item.content || item.answer || item.description || ''}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between gap-3 border-bottom py-2">
      <div className="fw-semibold text-body">{label}</div>
      <div className="text-secondary text-end">{value || 'N/A'}</div>
    </div>
  );
}

export default function NewsPromotionDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fallbackCover = 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1600&q=80';

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await newsPromotionAPI.detail(id);
        const payload = response?.data?.data ?? response?.data ?? {};
        if (active) setItem(payload);
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Không thể tải chi tiết nội dung.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="container tf-page-section"><div className="alert alert-light border rounded-4">Đang tải chi tiết...</div></div>;
  }

  if (error) {
    return (
      <div className="container tf-page-section">
        <div className="alert alert-danger rounded-4">{error}</div>
        <Link to="/news-promotions" className="btn btn-outline-dark rounded-pill px-4">Quay lại</Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container tf-page-section">
        <div className="alert alert-warning rounded-4">Không tìm thấy nội dung.</div>
        <Link to="/news-promotions" className="btn btn-outline-dark rounded-pill px-4">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="container tf-page-section">
      <div className="mb-4">
        <Link to="/news-promotions" className="text-decoration-none">&larr; Quay lại Tin tức & ưu đãi</Link>
      </div>
      <article className="tf-glass-panel rounded-5 overflow-hidden">
        <div className="ratio ratio-21x9">
          <img
            src={item.cover_image || fallbackCover}
            alt={item.title}
            className="w-100 h-100 object-fit-cover"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackCover) {
                e.currentTarget.src = fallbackCover;
              }
            }}
          />
        </div>
        <div className="p-4 p-lg-5">
          <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3">
            <span className={`badge rounded-pill ${item.type === 'promotion' ? 'text-bg-warning' : 'text-bg-info'}`}>
              {item.type === 'promotion' ? 'Ưu đãi' : 'Tin tức'}
            </span>
            <span className="text-muted small">{formatDate(item.published_at || item.created_at)}</span>
          </div>
          <h1 className="display-6 fw-bold mb-3">{item.title}</h1>
          <p className="lead text-secondary mb-4">{item.summary}</p>
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="border rounded-4 bg-white p-4 h-100">
                <h2 className="h4 fw-bold mb-3">Nội dung chi tiết</h2>
                <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }} className="text-body">
                  {item.content}
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="border rounded-4 bg-white p-4 h-100">
                <h2 className="h4 fw-bold mb-3">Thông tin bài viết</h2>
                <InfoRow label="Loại" value={item.type === 'promotion' ? 'Ưu đãi' : 'Tin tức'} />
                <InfoRow label="Danh mục" value={item.tag} />
                <InfoRow label="Ngày đăng" value={formatDate(item.published_at || item.created_at)} />
                <InfoRow label="Tác giả" value={item.author?.name || 'TravelFlow'} />
                <InfoRow label="Trạng thái" value={item.status === 'published' ? 'Đã đăng' : 'Nháp'} />
              </div>
            </div>
          </div>

          <section className="mb-4">
            <h2 className="h4 fw-bold mb-3">Thông tin đầy đủ</h2>
            <div className="border rounded-4 bg-white p-4">
              <InfoRow label="Hiệu lực từ" value={item.valid_from} />
              <InfoRow label="Hiệu lực đến" value={item.valid_until} />
              <InfoRow label="Đối tượng áp dụng" value={(item.target_audience || []).join(', ')} />
              <InfoRow label="Chương trình/tour áp dụng" value={(item.applicable_tours || []).join(', ')} />
              <InfoRow label="Kênh đặt" value={(item.booking_channels || []).join(', ')} />
              <InfoRow label="Liên hệ" value={item.contact_info?.hotline || item.contact_info?.email} />
            </div>
          </section>

          <DetailList title="Điểm nổi bật" items={item.key_highlights} />
          <DetailList title="Lợi ích" items={item.benefits} />
          <DetailList title="Điều kiện áp dụng" items={item.conditions} />
          <DetailList title="Các mục chi tiết" items={item.detail_sections} />
          <DetailList title="Câu hỏi thường gặp" items={item.faq} />

          {item.related_links?.length > 0 && (
            <section>
              <h2 className="h4 fw-bold mb-3">Liên kết liên quan</h2>
              <div className="d-flex flex-wrap gap-2">
                {item.related_links.map((link, index) => (
                  <a
                    key={`${link.label || 'link'}-${index}`}
                    href={link.url}
                    className="btn btn-outline-primary rounded-pill px-4"
                  >
                    {link.label || link.url}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
