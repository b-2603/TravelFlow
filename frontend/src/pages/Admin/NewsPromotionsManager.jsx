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
    detailSections: [],
    keyHighlights: [],
    benefits: [],
    conditions: [],
    targetAudience: [],
    applicableTours: [],
    bookingChannels: [],
    faq: [],
    contactInfo: { hotline: '', email: '' },
    relatedLinks: [],
    validFrom: '',
    validUntil: '',
  };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DETAIL_SUGGESTIONS = {
  keyHighlights: ['Giảm giá theo chương trình', 'Số lượng ưu đãi có hạn', 'Áp dụng trong thời gian khuyến mãi', 'Có thể đặt online', 'Hỗ trợ tư vấn nhanh'],
  benefits: ['Tiết kiệm chi phí', 'Lịch trình được tối ưu', 'Hỗ trợ trước và trong chuyến đi', 'Phù hợp đặt theo nhóm', 'Nhiều lựa chọn thanh toán'],
  conditions: ['Áp dụng cho booking mới', 'Không áp dụng đồng thời ưu đãi khác', 'Cần đặt cọc để giữ chỗ', 'Ưu đãi tùy tình trạng chỗ', 'Không quy đổi thành tiền mặt'],
  targetAudience: ['Gia đình', 'Nhóm bạn', 'Cặp đôi', 'Khách công ty', 'Khách đi lần đầu'],
  applicableTours: ['Tour trong nước', 'Tour nước ngoài', 'Tour hè', 'Tour nghỉ dưỡng', 'Tour cuối tuần'],
  bookingChannels: ['Website', 'Hotline', 'Văn phòng', 'Fanpage', 'Email'],
};

function normalizeList(items) {
  return Array.isArray(items) ? items : [];
}

function compactTextList(items) {
  return Array.isArray(items) ? items.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

function compactObjectList(items, keys) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) =>
      keys.reduce((result, key) => {
        result[key] = String(item?.[key] || '').trim();
        return result;
      }, {})
    )
    .filter((item) => keys.some((key) => item[key]));
}

function TextListEditor({ label, items, onChange, placeholder = 'Nhập nội dung', suggestions = [] }) {
  const list = normalizeList(items);

  const updateItem = (index, value) => {
    const next = [...list];
    next[index] = value;
    onChange(next);
  };

  const addSuggestion = (suggestion) => {
    if (list.includes(suggestion)) return;
    onChange([...list, suggestion]);
  };

  return (
    <div>
      <label className="form-label fw-semibold">{label}</label>
      <div className="d-grid gap-2">
        {list.length === 0 ? <div className="small text-muted">Chưa có mục nào.</div> : null}
        {suggestions.length ? (
          <div className="d-flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                className="btn btn-sm btn-light border rounded-pill"
                key={`${label}-${suggestion}`}
                onClick={() => addSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        {list.map((item, index) => (
          <div className="d-flex gap-2" key={`${label}-${index}`}>
            <input className="form-control rounded-pill" value={item} placeholder={placeholder} onChange={(e) => updateItem(index, e.target.value)} />
            <button type="button" className="btn btn-outline-danger rounded-pill" onClick={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
              Xóa
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => onChange([...list, ''])}>
          Thêm mục
        </button>
      </div>
    </div>
  );
}

function SectionEditor({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];

  const updateItem = (index, key, value) => {
    const next = [...list];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="form-label fw-semibold">Mục chi tiết</label>
      <div className="d-grid gap-3">
        {list.length === 0 ? <div className="small text-muted">Chưa có mục chi tiết.</div> : null}
        <div className="d-flex flex-wrap gap-2">
          {[
            { title: 'Chi tiết chương trình', content: 'Mô tả nội dung chính của tin tức hoặc ưu đãi.' },
            { title: 'Cách nhận ưu đãi', content: 'Khách chọn tour, đặt lịch và xác nhận với bộ phận tư vấn.' },
            { title: 'Thời gian áp dụng', content: 'Ưu đãi áp dụng theo thời gian đã thiết lập ở trên.' },
          ].map((preset) => (
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-pill"
              key={preset.title}
              onClick={() => onChange([...list, preset])}
            >
              {preset.title}
            </button>
          ))}
        </div>
        {list.map((item, index) => (
          <div className="rounded-4 border bg-white p-3" key={`section-${index}`}>
            <input className="form-control rounded-pill mb-2" value={item.title || ''} placeholder="Tiêu đề mục" onChange={(e) => updateItem(index, 'title', e.target.value)} />
            <textarea className="form-control rounded-4" rows="3" value={item.content || ''} placeholder="Nội dung mục" onChange={(e) => updateItem(index, 'content', e.target.value)} />
            <button type="button" className="btn btn-outline-danger btn-sm rounded-pill mt-2" onClick={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
              Xóa mục
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => onChange([...list, { title: '', content: '' }])}>
          Thêm mục chi tiết
        </button>
      </div>
    </div>
  );
}

function FaqEditor({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];

  const updateItem = (index, key, value) => {
    const next = [...list];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="form-label fw-semibold">Câu hỏi thường gặp</label>
      <div className="d-grid gap-3">
        {list.length === 0 ? <div className="small text-muted">Chưa có câu hỏi.</div> : null}
        <div className="d-flex flex-wrap gap-2">
          {[
            { question: 'Ưu đãi này áp dụng đến khi nào?', answer: 'Vui lòng xem thời gian hiệu lực của chương trình.' },
            { question: 'Có thể áp dụng chung với ưu đãi khác không?', answer: 'Chương trình không áp dụng đồng thời với ưu đãi khác trừ khi có thông báo riêng.' },
            { question: 'Tôi cần liên hệ ở đâu để được tư vấn?', answer: 'Khách hàng có thể liên hệ hotline hoặc email trong phần thông tin liên hệ.' },
          ].map((preset) => (
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-pill"
              key={preset.question}
              onClick={() => onChange([...list, preset])}
            >
              {preset.question}
            </button>
          ))}
        </div>
        {list.map((item, index) => (
          <div className="rounded-4 border bg-white p-3" key={`faq-${index}`}>
            <input className="form-control rounded-pill mb-2" value={item.question || ''} placeholder="Câu hỏi" onChange={(e) => updateItem(index, 'question', e.target.value)} />
            <textarea className="form-control rounded-4" rows="2" value={item.answer || ''} placeholder="Câu trả lời" onChange={(e) => updateItem(index, 'answer', e.target.value)} />
            <button type="button" className="btn btn-outline-danger btn-sm rounded-pill mt-2" onClick={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
              Xóa câu hỏi
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => onChange([...list, { question: '', answer: '' }])}>
          Thêm câu hỏi
        </button>
      </div>
    </div>
  );
}

function LinkEditor({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];

  const updateItem = (index, key, value) => {
    const next = [...list];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="form-label fw-semibold">Liên kết liên quan</label>
      <div className="d-grid gap-2">
        {list.length === 0 ? <div className="small text-muted">Chưa có liên kết.</div> : null}
        <div className="d-flex flex-wrap gap-2">
          {[
            { label: 'Xem danh sách tour', url: '/tours' },
            { label: 'Liên hệ tư vấn', url: '/contact' },
            { label: 'Tin tức & ưu đãi', url: '/news-promotions' },
          ].map((preset) => (
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-pill"
              key={preset.label}
              onClick={() => onChange([...list, preset])}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {list.map((item, index) => (
          <div className="row g-2" key={`link-${index}`}>
            <div className="col-md-5">
              <input className="form-control rounded-pill" value={item.label || ''} placeholder="Tên liên kết" onChange={(e) => updateItem(index, 'label', e.target.value)} />
            </div>
            <div className="col-md-5">
              <input className="form-control rounded-pill" value={item.url || ''} placeholder="/tours hoặc https://..." onChange={(e) => updateItem(index, 'url', e.target.value)} />
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-outline-danger rounded-pill w-100" onClick={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
                Xóa
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => onChange([...list, { label: '', url: '' }])}>
          Thêm liên kết
        </button>
      </div>
    </div>
  );
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
      detailSections: item.detail_sections || [],
      keyHighlights: item.key_highlights || [],
      benefits: item.benefits || [],
      conditions: item.conditions || [],
      targetAudience: item.target_audience || [],
      applicableTours: item.applicable_tours || [],
      bookingChannels: item.booking_channels || [],
      faq: item.faq || [],
      contactInfo: item.contact_info || { hotline: '', email: '' },
      relatedLinks: item.related_links || [],
      validFrom: item.valid_from || '',
      validUntil: item.valid_until || '',
    });
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
    payload.append('detail_sections', JSON.stringify(compactObjectList(form.detailSections, ['title', 'content'])));
    payload.append('key_highlights', JSON.stringify(compactTextList(form.keyHighlights)));
    payload.append('benefits', JSON.stringify(compactTextList(form.benefits)));
    payload.append('conditions', JSON.stringify(compactTextList(form.conditions)));
    payload.append('target_audience', JSON.stringify(compactTextList(form.targetAudience)));
    payload.append('applicable_tours', JSON.stringify(compactTextList(form.applicableTours)));
    payload.append('booking_channels', JSON.stringify(compactTextList(form.bookingChannels)));
    payload.append('faq', JSON.stringify(compactObjectList(form.faq, ['question', 'answer'])));
    payload.append('contact_info', JSON.stringify(form.contactInfo || {}));
    payload.append('related_links', JSON.stringify(compactObjectList(form.relatedLinks, ['label', 'url'])));
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
                  <div className="fw-bold">Thông tin bổ sung cho trang chi tiết</div>
                  <div className="small text-muted mb-3">Các mục này không bắt buộc; thêm khi cần làm rõ ưu đãi hoặc bài viết.</div>
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
                      <TextListEditor
                        label="Điểm nổi bật"
                        items={form.keyHighlights}
                        placeholder="Ví dụ: Giảm 15% cho tour hè"
                        suggestions={DETAIL_SUGGESTIONS.keyHighlights}
                        onChange={(keyHighlights) => setForm((c) => ({ ...c, keyHighlights }))}
                      />
                    </div>
                    <div className="col-12">
                      <TextListEditor
                        label="Lợi ích"
                        items={form.benefits}
                        placeholder="Ví dụ: Tặng bữa tối đặc sản"
                        suggestions={DETAIL_SUGGESTIONS.benefits}
                        onChange={(benefits) => setForm((c) => ({ ...c, benefits }))}
                      />
                    </div>
                    <div className="col-12">
                      <TextListEditor
                        label="Điều kiện áp dụng"
                        items={form.conditions}
                        placeholder="Ví dụ: Áp dụng cho booking từ 2 khách"
                        suggestions={DETAIL_SUGGESTIONS.conditions}
                        onChange={(conditions) => setForm((c) => ({ ...c, conditions }))}
                      />
                    </div>
                    <div className="col-12">
                      <SectionEditor items={form.detailSections} onChange={(detailSections) => setForm((c) => ({ ...c, detailSections }))} />
                    </div>
                    <div className="col-md-6">
                      <TextListEditor
                        label="Đối tượng áp dụng"
                        items={form.targetAudience}
                        placeholder="Ví dụ: Gia đình, nhóm bạn"
                        suggestions={DETAIL_SUGGESTIONS.targetAudience}
                        onChange={(targetAudience) => setForm((c) => ({ ...c, targetAudience }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <TextListEditor
                        label="Tour áp dụng"
                        items={form.applicableTours}
                        placeholder="Ví dụ: Đà Nẵng 3N2Đ"
                        suggestions={DETAIL_SUGGESTIONS.applicableTours}
                        onChange={(applicableTours) => setForm((c) => ({ ...c, applicableTours }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <TextListEditor
                        label="Kênh đặt"
                        items={form.bookingChannels}
                        placeholder="Ví dụ: Website, hotline, văn phòng"
                        suggestions={DETAIL_SUGGESTIONS.bookingChannels}
                        onChange={(bookingChannels) => setForm((c) => ({ ...c, bookingChannels }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <FaqEditor items={form.faq} onChange={(faq) => setForm((c) => ({ ...c, faq }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Thông tin liên hệ</label>
                      <div className="d-grid gap-2">
                        <input
                          className="form-control rounded-pill"
                          value={form.contactInfo?.hotline || ''}
                          placeholder="Hotline"
                          onChange={(e) => setForm((c) => ({ ...c, contactInfo: { ...(c.contactInfo || {}), hotline: e.target.value } }))}
                        />
                        <input
                          className="form-control rounded-pill"
                          value={form.contactInfo?.email || ''}
                          placeholder="Email"
                          onChange={(e) => setForm((c) => ({ ...c, contactInfo: { ...(c.contactInfo || {}), email: e.target.value } }))}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <LinkEditor items={form.relatedLinks} onChange={(relatedLinks) => setForm((c) => ({ ...c, relatedLinks }))} />
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
