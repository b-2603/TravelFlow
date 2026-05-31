import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const paymentOptions = [
  { value: 'bank', label: 'Chuyển khoản ngân hàng' },
  { value: 'vnpay', label: 'VNPay' },
];

const emailTemplateOptions = [
  { key: 'booking_confirmation', label: 'Xác nhận booking' },
  { key: 'refund_notice', label: 'Thông báo hoàn tiền' },
  { key: 'support_reply', label: 'Phản hồi ticket hỗ trợ' },
  { key: 'tour_approval', label: 'Thông báo duyệt tour' },
  { key: 'partner_approval', label: 'Thông báo duyệt đối tác' },
];

function defaultCancellationPolicy() {
  return {
    tiers: [
      {
        key: 'flex_15_plus',
        label: 'Hủy trước 15+ ngày',
        min_days: 15,
        max_days: '',
        refund_rate: 1,
        fee_rate: 0,
        processing_days_text: '3, 5',
        refund_text: 'Hoàn 100%, miễn phí hoàn toàn',
        extra_note: 'Nhận tiền về trong 3-5 ngày làm việc',
      },
      {
        key: 'care_7_14',
        label: 'Hủy trước 7-14 ngày',
        min_days: 7,
        max_days: 14,
        refund_rate: 0.7,
        fee_rate: 0.3,
        processing_days_text: '5, 7',
        refund_text: 'Hoàn 70%, công ty giữ lại 30% làm phí hủy',
        extra_note: '',
      },
      {
        key: 'late_3_6',
        label: 'Hủy trước 3-6 ngày',
        min_days: 3,
        max_days: 6,
        refund_rate: 0.5,
        fee_rate: 0.5,
        processing_days_text: '5, 7',
        refund_text: 'Hoàn 50%, công ty đã đặt cọc nhiều dịch vụ',
        extra_note: '',
      },
      {
        key: 'urgent_0_2',
        label: 'Hủy trong 0-2 ngày',
        min_days: 0,
        max_days: 2,
        refund_rate: 0,
        fee_rate: 1,
        processing_days_text: '0, 0',
        refund_text: 'Không hoàn tiền mặt',
        extra_note: 'Có thể dời ngày 1 lần miễn phí',
      },
    ],
    alternatives: [
      { key: 'reschedule', label: 'Dời ngày khởi hành' },
      { key: 'change_tour', label: 'Đổi sang tour tương đương' },
      { key: 'voucher', label: 'Nhận voucher bảo lưu 12 tháng' },
    ],
  };
}

function normalizePaymentMethods(value) {
  const items = Array.isArray(value) ? value : [];
  return paymentOptions.reduce((state, option) => {
    state[option.value] = items.includes(option.value);
    return state;
  }, {});
}

function normalizeTemplateMap(value) {
  if (Array.isArray(value)) {
    return emailTemplateOptions.reduce((state, option, index) => {
      state[option.key] = value[index] || '';
      return state;
    }, {});
  }

  return emailTemplateOptions.reduce((state, option) => {
    state[option.key] = value?.[option.key] || '';
    return state;
  }, {});
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeCancellationPolicy(value) {
  const source = value && typeof value === 'object' ? value : defaultCancellationPolicy();
  const tiers = Array.isArray(source.tiers) && source.tiers.length ? source.tiers : defaultCancellationPolicy().tiers;
  const alternatives = Array.isArray(source.alternatives) && source.alternatives.length ? source.alternatives : defaultCancellationPolicy().alternatives;

  return {
    tiers: tiers.map((tier, index) => ({
      key: tier.key || `tier_${index + 1}`,
      label: tier.label || '',
      min_days: tier.min_days ?? '',
      max_days: tier.max_days ?? '',
      refund_rate: tier.refund_rate ?? '',
      fee_rate: tier.fee_rate ?? '',
      processing_days_text: Array.isArray(tier.processing_days) ? tier.processing_days.join(', ') : '',
      refund_text: tier.refund_text || '',
      extra_note: tier.extra_note || '',
    })),
    alternatives: alternatives.map((item, index) => ({
      key: item.key || `alternative_${index + 1}`,
      label: item.label || '',
    })),
  };
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberOrEmpty(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? '' : numericValue;
}

function buildPayload(form) {
  return {
    company_name: form.company_name,
    logo: form.logo,
    address: form.address,
    hotline: form.hotline,
    bank_name: form.bank_name,
    bank_code: form.bank_code,
    bank_account_number: form.bank_account_number,
    bank_account_name: form.bank_account_name,
    bank_branch: form.bank_branch,
    payment_note_prefix: form.payment_note_prefix,
    payment_methods: paymentOptions.filter((option) => form.payment_methods?.[option.value]).map((option) => option.value),
    featured_destinations: form.featured_destinations,
    banner_messages: form.banner_messages,
    email_templates: form.email_templates,
    cancellation_policy: {
      tiers: form.cancellation_policy.tiers.map((tier) => ({
        key: tier.key,
        label: tier.label,
        min_days: parseNumberOrEmpty(tier.min_days),
        max_days: parseNumberOrEmpty(tier.max_days),
        refund_rate: parseNumberOrEmpty(tier.refund_rate),
        fee_rate: parseNumberOrEmpty(tier.fee_rate),
        processing_days: splitCsv(tier.processing_days_text).map((item) => Number(item)).filter((item) => !Number.isNaN(item)),
        refund_text: tier.refund_text,
        extra_note: tier.extra_note,
      })),
      alternatives: form.cancellation_policy.alternatives.map((item) => ({
        key: item.key,
        label: item.label,
      })),
    },
  };
}

function createEmptyForm(payload = {}) {
  return {
    company_name: payload.company_name || '',
    logo: payload.logo || '',
    address: payload.address || '',
    hotline: payload.hotline || '',
    bank_name: payload.bank_name || '',
    bank_code: payload.bank_code || '',
    bank_account_number: payload.bank_account_number || '',
    bank_account_name: payload.bank_account_name || '',
    bank_branch: payload.bank_branch || '',
    payment_note_prefix: payload.payment_note_prefix || '',
    payment_methods: normalizePaymentMethods(payload.payment_methods),
    featured_destinations: normalizeList(payload.featured_destinations),
    banner_messages: normalizeList(payload.banner_messages),
    email_templates: normalizeTemplateMap(payload.email_templates),
    cancellation_policy: normalizeCancellationPolicy(payload.cancellation_policy),
  };
}

function updateListItem(setter, listName, index, field, value, nestedKey = 'tiers') {
  setter((form) => ({
    ...form,
    [listName]: {
      ...form[listName],
      [nestedKey]: form[listName][nestedKey].map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)),
    },
  }));
}

export default function SystemSettingsEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [destinationDraft, setDestinationDraft] = useState('');
  const [bannerDraft, setBannerDraft] = useState('');

  const { data: payload } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await adminAPI.settings()).data?.data ?? {},
  });

  useEffect(() => {
    if (payload) {
      setForm(createEmptyForm(payload));
    }
  }, [payload]);

  const savedPayload = useMemo(() => (form ? buildPayload(form) : null), [form]);

  const updateMutation = useMutation({
    mutationFn: (payload) => adminAPI.updateSettings(payload),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình hệ thống.');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể lưu cấu hình hệ thống.');
    },
  });

  if (!form) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="text-muted">Đang tải cấu hình hệ thống...</div>
      </div>
    );
  }

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between gap-3">
        <div>
          <h2 className="h5 mb-1">Cấu hình hệ thống</h2>
          <p className="mb-0 text-muted">Quản lý thông tin công ty, thanh toán, email template, banner và chính sách hủy.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => updateMutation.mutate(savedPayload)} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="rounded-4 border p-3">
            <h3 className="h6 mb-3">Thông tin công ty</h3>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Tên công ty</label>
                <input className="form-control" value={form.company_name} onChange={(e) => setForm((value) => ({ ...value, company_name: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Logo URL</label>
                <input className="form-control" value={form.logo} onChange={(e) => setForm((value) => ({ ...value, logo: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Địa chỉ</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm((value) => ({ ...value, address: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Hotline</label>
                <input className="form-control" value={form.hotline} onChange={(e) => setForm((value) => ({ ...value, hotline: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="rounded-4 border p-3">
            <h3 className="h6 mb-3">Thanh toán</h3>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Ngân hàng</label>
                <input className="form-control" value={form.bank_name} onChange={(e) => setForm((value) => ({ ...value, bank_name: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Mã ngân hàng</label>
                <input className="form-control" value={form.bank_code} onChange={(e) => setForm((value) => ({ ...value, bank_code: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Số tài khoản</label>
                <input
                  className="form-control"
                  value={form.bank_account_number}
                  onChange={(e) => setForm((value) => ({ ...value, bank_account_number: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Chủ tài khoản</label>
                <input
                  className="form-control"
                  value={form.bank_account_name}
                  onChange={(e) => setForm((value) => ({ ...value, bank_account_name: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Chi nhánh</label>
                <input className="form-control" value={form.bank_branch} onChange={(e) => setForm((value) => ({ ...value, bank_branch: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Tiền tố nội dung chuyển khoản</label>
                <input
                  className="form-control"
                  value={form.payment_note_prefix}
                  onChange={(e) => setForm((value) => ({ ...value, payment_note_prefix: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <div className="d-flex flex-wrap gap-3">
                  {paymentOptions.map((option) => (
                    <label key={option.value} className="form-check form-check-inline m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={Boolean(form.payment_methods[option.value])}
                        onChange={(e) =>
                          setForm((value) => ({
                            ...value,
                            payment_methods: { ...value.payment_methods, [option.value]: e.target.checked },
                          }))
                        }
                      />
                      <span className="form-check-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h6 mb-3">Điểm đến nổi bật</h3>
            <div className="d-flex flex-column gap-2">
              {form.featured_destinations.map((item, index) => (
                <div key={`${item}-${index}`} className="input-group">
                  <input
                    className="form-control"
                    value={item}
                    onChange={(e) =>
                      setForm((value) => ({
                        ...value,
                        featured_destinations: value.featured_destinations.map((current, currentIndex) => (currentIndex === index ? e.target.value : current)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() =>
                      setForm((value) => ({
                        ...value,
                        featured_destinations: value.featured_destinations.filter((_, currentIndex) => currentIndex !== index),
                      }))
                    }
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 d-flex gap-2">
              <input className="form-control" placeholder="Thêm điểm đến mới" value={destinationDraft} onChange={(e) => setDestinationDraft(e.target.value)} />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {
                  const next = destinationDraft.trim();
                  if (!next) return;
                  setForm((value) => ({ ...value, featured_destinations: [...value.featured_destinations, next] }));
                  setDestinationDraft('');
                }}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h6 mb-3">Thông báo banner</h3>
            <div className="d-flex flex-column gap-2">
              {form.banner_messages.map((item, index) => (
                <div key={`${item}-${index}`} className="input-group">
                  <input
                    className="form-control"
                    value={item}
                    onChange={(e) =>
                      setForm((value) => ({
                        ...value,
                        banner_messages: value.banner_messages.map((current, currentIndex) => (currentIndex === index ? e.target.value : current)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() =>
                      setForm((value) => ({
                        ...value,
                        banner_messages: value.banner_messages.filter((_, currentIndex) => currentIndex !== index),
                      }))
                    }
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 d-flex gap-2">
              <input className="form-control" placeholder="Thêm thông báo banner" value={bannerDraft} onChange={(e) => setBannerDraft(e.target.value)} />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {
                  const next = bannerDraft.trim();
                  if (!next) return;
                  setForm((value) => ({ ...value, banner_messages: [...value.banner_messages, next] }));
                  setBannerDraft('');
                }}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="rounded-4 border p-3">
            <h3 className="h6 mb-3">Email template</h3>
            <div className="row g-3">
              {emailTemplateOptions.map((option) => (
                <div className="col-md-6" key={option.key}>
                  <label className="form-label">{option.label}</label>
                  <input
                    className="form-control"
                    value={form.email_templates[option.key]}
                    onChange={(e) =>
                      setForm((value) => ({
                        ...value,
                        email_templates: { ...value.email_templates, [option.key]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="rounded-4 border p-3">
            <h3 className="h6 mb-3">Chính sách hủy tour</h3>
            <div className="d-grid gap-3">
              {form.cancellation_policy.tiers.map((tier, index) => (
                <div key={tier.key || index} className="rounded-3 border p-3 bg-light-subtle">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Tên mốc</label>
                      <input className="form-control" value={tier.label} onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'label', e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Từ ngày</label>
                      <input
                        type="number"
                        className="form-control"
                        value={tier.min_days}
                        onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'min_days', e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Đến ngày</label>
                      <input
                        type="number"
                        className="form-control"
                        value={tier.max_days}
                        onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'max_days', e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Hoàn tiền</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={tier.refund_rate}
                        onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'refund_rate', e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Phí giữ lại</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={tier.fee_rate}
                        onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'fee_rate', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ngày xử lý</label>
                      <input
                        className="form-control"
                        value={tier.processing_days_text}
                        onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'processing_days_text', e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Mô tả hoàn tiền</label>
                      <input
                        className="form-control"
                        value={tier.refund_text}
                        onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'refund_text', e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ghi chú thêm</label>
                      <input
                        className="form-control"
                        value={tier.extra_note}
                        onChange={(e) => updateListItem(setForm, 'cancellation_policy', index, 'extra_note', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="rounded-4 border p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h6 mb-0">Phương án thay thế khi hủy</h3>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() =>
                  setForm((value) => ({
                    ...value,
                    cancellation_policy: {
                      ...value.cancellation_policy,
                      alternatives: [...value.cancellation_policy.alternatives, { key: `alternative_${value.cancellation_policy.alternatives.length + 1}`, label: '' }],
                    },
                  }))
                }
              >
                Thêm phương án
              </button>
            </div>
            <div className="d-grid gap-2">
              {form.cancellation_policy.alternatives.map((item, index) => (
                <div key={item.key || index} className="input-group">
                  <input
                    className="form-control"
                    value={item.label}
                    onChange={(e) =>
                      setForm((value) => ({
                        ...value,
                        cancellation_policy: {
                          ...value.cancellation_policy,
                          alternatives: value.cancellation_policy.alternatives.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, label: e.target.value } : current
                          ),
                        },
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() =>
                      setForm((value) => ({
                        ...value,
                        cancellation_policy: {
                          ...value.cancellation_policy,
                          alternatives: value.cancellation_policy.alternatives.filter((_, currentIndex) => currentIndex !== index),
                        },
                      }))
                    }
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
