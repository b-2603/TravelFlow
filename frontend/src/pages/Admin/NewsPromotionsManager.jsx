import { useEffect, useMemo, useState } from 'react';
import { newsPromotionAPI } from '../../services/api';

function emptyForm() {
  return {
    id: '',
    type: 'news',
    title: '',
    summary: '',
    content: '',
    tag: '',
    publishedAt: '',
    status: 'published',
    coverImage: '',
    coverFile: null,
    detailSectionsJson: '[]',
    keyHighlightsJson: '[]',
    benefitsJson: '[]',
    conditionsJson: '[]',
    targetAudienceJson: '[]',
    applicableToursJson: '[]',
    bookingChannelsJson: '[]',
    faqJson: '[]',
    contactInfoJson: '{}',
    relatedLinksJson: '[]',
    validFrom: '',
    validUntil: '',
  };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NewsPromotionsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState(emptyForm());

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await newsPromotionAPI.managerList({});
      const payload = response?.data?.data ?? response?.data ?? {};
      setItems(payload.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (tab === 'all') return items;
    return items.filter((item) => item.type === tab);
  }, [items, tab]);

  const previewCover =
    form.coverFile
      ? URL.createObjectURL(form.coverFile)
      : form.coverImage || 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80';

  const resetForm = () => setForm(emptyForm());

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      type: item.type,
      title: item.title,
      summary: item.summary,
      content: item.content,
      tag: item.tag || '',
      publishedAt: item.published_at || '',
      status: item.status,
      coverImage: item.cover_image || '',
      coverFile: null,
      detailSectionsJson: JSON.stringify(item.detail_sections || [], null, 2),
      keyHighlightsJson: JSON.stringify(item.key_highlights || [], null, 2),
      benefitsJson: JSON.stringify(item.benefits || [], null, 2),
      conditionsJson: JSON.stringify(item.conditions || [], null, 2),
      targetAudienceJson: JSON.stringify(item.target_audience || [], null, 2),
      applicableToursJson: JSON.stringify(item.applicable_tours || [], null, 2),
      bookingChannelsJson: JSON.stringify(item.booking_channels || [], null, 2),
      faqJson: JSON.stringify(item.faq || [], null, 2),
      contactInfoJson: JSON.stringify(item.contact_info || {}, null, 2),
      relatedLinksJson: JSON.stringify(item.related_links || [], null, 2),
      validFrom: item.valid_from || '',
      validUntil: item.valid_until || '',
    });
  };

  const safeJson = (text, fallback) => {
    try {
      const parsed = JSON.parse(text || '');
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    payload.append('type', form.type);
    payload.append('title', form.title);
    payload.append('summary', form.summary);
    payload.append('content', form.content);
    payload.append('tag', form.tag);
    payload.append('published_at', form.publishedAt);
    payload.append('status', form.status);
    payload.append('valid_from', form.validFrom || '');
    payload.append('valid_until', form.validUntil || '');
    payload.append('detail_sections', JSON.stringify(safeJson(form.detailSectionsJson, [])));
    payload.append('key_highlights', JSON.stringify(safeJson(form.keyHighlightsJson, [])));
    payload.append('benefits', JSON.stringify(safeJson(form.benefitsJson, [])));
    payload.append('conditions', JSON.stringify(safeJson(form.conditionsJson, [])));
    payload.append('target_audience', JSON.stringify(safeJson(form.targetAudienceJson, [])));
    payload.append('applicable_tours', JSON.stringify(safeJson(form.applicableToursJson, [])));
    payload.append('booking_channels', JSON.stringify(safeJson(form.bookingChannelsJson, [])));
    payload.append('faq', JSON.stringify(safeJson(form.faqJson, [])));
    payload.append('contact_info', JSON.stringify(safeJson(form.contactInfoJson, {})));
    payload.append('related_links', JSON.stringify(safeJson(form.relatedLinksJson, [])));
    if (form.coverFile) payload.append('cover_image_file', form.coverFile);
    if (!form.coverFile && form.coverImage) payload.append('cover_image', form.coverImage);

    if (form.id) {
      await newsPromotionAPI.update(form.id, payload);
    } else {
      await newsPromotionAPI.create(payload);
    }

    await load();
    resetForm();
  };

  const handleDelete = async (id) => {
    await newsPromotionAPI.remove(id);
    await load();
    if (form.id === id) resetForm();
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <div className="text-uppercase small fw-bold text-primary mb-2">Admin content</div>
          <h1 className="h3 mb-1">Quản trị tin tức & ưu đãi</h1>
          <div className="text-muted">Tạo, sửa, xóa bài viết và quản lý ảnh bìa.</div>
        </div>
        <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={load}>
          Tải lại
        </button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {['all', 'news', 'promotion'].map((key) => (
          <button
            key={key}
            type="button"
            className={`btn rounded-pill px-4 ${tab === key ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTab(key)}
          >
            {key === 'all' ? 'Tất cả' : key === 'news' ? 'Tin tức' : 'Ưu đãi'}
          </button>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-xl-7">
          {loading ? (
            <div className="alert alert-light border rounded-4">Đang tải...</div>
          ) : error ? (
            <div className="alert alert-danger rounded-4">{error}</div>
          ) : (
            <div className="row g-3">
              {filteredItems.map((item) => (
                <div className="col-md-6" key={item.id}>
                  <article className="tf-tour-card h-100 overflow-hidden">
                    <div className="tf-card-media" style={{ height: '12rem' }}>
                      <img
                        src={item.cover_image || 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80'}
                        alt={item.title}
                      />
                    </div>
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <span className="badge text-bg-light border">{item.type}</span>
                        <span className="small text-muted">{formatDate(item.published_at || item.created_at)}</span>
                      </div>
                      <div className="fw-bold mb-2">{item.title}</div>
                      <div className="small text-muted mb-2">{item.summary}</div>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => handleEdit(item)}>
                          Sửa
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDelete(item.id)}>
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-xl-5">
          <div className="tf-glass-panel rounded-5 p-4 p-lg-5 sticky-top" style={{ top: '6.5rem' }}>
            <h2 className="h4 fw-bold mb-4">{form.id ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Loại</label>
                <select className="form-select rounded-pill" value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}>
                  <option value="news">Tin tức</option>
                  <option value="promotion">Ưu đãi</option>
                </select>
              </div>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Tiêu đề</label>
                <input className="form-control rounded-pill" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} required />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Ảnh bìa</label>
                <input type="file" accept="image/*" className="form-control rounded-pill" onChange={(e) => setForm((c) => ({ ...c, coverFile: e.target.files?.[0] || null }))} />
                <div className="form-text">Nếu không tải ảnh mới, có thể giữ URL ảnh hiện tại.</div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Ảnh bìa URL</label>
                <input className="form-control rounded-pill" value={form.coverImage} onChange={(e) => setForm((c) => ({ ...c, coverImage: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="col-12">
                <button
                  type="button"
                  className="btn btn-outline-primary rounded-pill px-4"
                  data-bs-toggle="collapse"
                  data-bs-target="#coverPreviewPanel"
                  aria-expanded="false"
                  aria-controls="coverPreviewPanel"
                >
                  Xem trước ảnh bìa
                </button>
              </div>
              <div className="col-12 collapse" id="coverPreviewPanel">
                <div className="rounded-4 border bg-white p-3">
                  <div className="small text-muted mb-2">Ảnh bìa xem trước</div>
                  <div className="ratio ratio-16x9 rounded-4 overflow-hidden">
                    <img src={previewCover} alt="Xem trước ảnh bìa" className="w-100 h-100 object-fit-cover" />
                  </div>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Mô tả ngắn</label>
                <textarea className="form-control rounded-4" rows="2" value={form.summary} onChange={(e) => setForm((c) => ({ ...c, summary: e.target.value }))} required />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Nội dung</label>
                <textarea className="form-control rounded-4" rows="5" value={form.content} onChange={(e) => setForm((c) => ({ ...c, content: e.target.value }))} required />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Thẻ</label>
                <input className="form-control rounded-pill" value={form.tag} onChange={(e) => setForm((c) => ({ ...c, tag: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Ngày đăng</label>
                <input type="date" className="form-control rounded-pill" value={form.publishedAt} onChange={(e) => setForm((c) => ({ ...c, publishedAt: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Trạng thái</label>
                <select className="form-select rounded-pill" value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}>
                  <option value="published">Đã đăng</option>
                  <option value="draft">Nháp</option>
                </select>
              </div>
              <div className="col-12 d-flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary rounded-pill px-4">{form.id ? 'Cập nhật' : 'Lưu bài'}</button>
                <button type="button" className="btn btn-outline-dark rounded-pill px-4" onClick={resetForm}>Hủy</button>
              </div>

              <div className="col-12 mt-3">
                <div className="border rounded-4 p-3 bg-light">
                  <div className="fw-bold mb-3">Thông tin chi tiết nâng cao</div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Hiệu lực từ</label>
                      <input type="date" className="form-control rounded-pill" value={form.validFrom} onChange={(e) => setForm((c) => ({ ...c, validFrom: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Hiệu lực đến</label>
                      <input type="date" className="form-control rounded-pill" value={form.validUntil} onChange={(e) => setForm((c) => ({ ...c, validUntil: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Điểm nổi bật (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.keyHighlightsJson} onChange={(e) => setForm((c) => ({ ...c, keyHighlightsJson: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Lợi ích (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.benefitsJson} onChange={(e) => setForm((c) => ({ ...c, benefitsJson: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Điều kiện áp dụng (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.conditionsJson} onChange={(e) => setForm((c) => ({ ...c, conditionsJson: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Mục chi tiết (JSON array of objects)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="4" value={form.detailSectionsJson} onChange={(e) => setForm((c) => ({ ...c, detailSectionsJson: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Đối tượng áp dụng (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.targetAudienceJson} onChange={(e) => setForm((c) => ({ ...c, targetAudienceJson: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tour áp dụng (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.applicableToursJson} onChange={(e) => setForm((c) => ({ ...c, applicableToursJson: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Kênh đặt (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.bookingChannelsJson} onChange={(e) => setForm((c) => ({ ...c, bookingChannelsJson: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Câu hỏi thường gặp (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.faqJson} onChange={(e) => setForm((c) => ({ ...c, faqJson: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Thông tin liên hệ (JSON object)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.contactInfoJson} onChange={(e) => setForm((c) => ({ ...c, contactInfoJson: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Liên kết liên quan (JSON array)</label>
                      <textarea className="form-control rounded-4 font-monospace" rows="3" value={form.relatedLinksJson} onChange={(e) => setForm((c) => ({ ...c, relatedLinksJson: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
