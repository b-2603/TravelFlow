import { Formik, Form, Field } from 'formik';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { partnerAPI } from '../../services/api';
import { formatCurrency, formatDate, statusBadgeClass } from '../../utils/formatters';

const emptyServiceForm = {
  name: '',
  service_category: 'hotel',
  price: '',
  unit: 'đơn vị',
  available_quantity: 0,
  pricing_note: '',
  status: 'active',
  cancellation_policy: '',
};

function serviceStatusLabel(status) {
  return status === 'active' ? 'Đang mở' : 'Ngưng';
}

export default function Services() {
  const queryClient = useQueryClient();
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [facilityImageFiles, setFacilityImageFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const { data: payload = {}, isLoading } = useQuery({
    queryKey: ['partner-services'],
    queryFn: async () => (await partnerAPI.services()).data?.data ?? {},
  });

  const profile = payload?.profile || {};
  const services = payload?.services || [];
  const linkedTours = payload?.linked_tours || [];
  const serviceOrders = payload?.service_orders || [];
  const metrics = payload?.metrics || {};
  const breakdown = payload?.breakdown || {};
  const recentOrders = payload?.recent_orders || [];
  const recentLinkedTours = payload?.recent_linked_tours || [];

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const haystack = `${service.name || ''} ${service.service_category || ''} ${service.pricing_note || ''}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesStatus = !statusFilter || service.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['partner-services'] });
    queryClient.invalidateQueries({ queryKey: ['partner-dashboard'] });
  };

  const profileMutation = useMutation({
    mutationFn: (values) => partnerAPI.updateProfile(values),
    onSuccess: () => {
      toast.success('Cập nhật hồ sơ đối tác thành công');
      setBusinessLicenseFile(null);
      setFacilityImageFiles([]);
      refreshData();
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể cập nhật hồ sơ đối tác'),
  });

  const serviceMutation = useMutation({
    mutationFn: ({ id, payload }) => (id ? partnerAPI.updateService(id, payload) : partnerAPI.createService(payload)),
    onSuccess: () => {
      toast.success(selectedService ? 'Đã cập nhật dịch vụ đối tác' : 'Đã thêm dịch vụ đối tác');
      setSelectedService(null);
      refreshData();
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể lưu dịch vụ đối tác'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => partnerAPI.toggleServiceStatus(id),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái dịch vụ');
      refreshData();
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => partnerAPI.deleteService(id),
    onSuccess: () => {
      toast.success('Đã xóa dịch vụ');
      refreshData();
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể xóa dịch vụ'),
  });

  const serviceStatusBadges = {
    active: 'bg-success',
    inactive: 'bg-secondary',
  };

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column gap-3 flex-lg-row justify-content-between align-items-lg-end mb-4">
          <div>
            <h2 className="h4 mb-1">Cổng đối tác dịch vụ</h2>
            <p className="mb-0 text-muted">Quản lý hồ sơ công ty, catalog dịch vụ, tour liên kết và hiệu quả hợp tác.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/partner/dashboard" className="btn btn-outline-primary btn-sm">
              Xem tổng quan
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary btn-sm">
              Sửa hồ sơ cá nhân
            </Link>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {[
            { label: 'Giao dịch thành công', value: metrics.successful_payments ?? 0, note: 'Số booking đã ghi nhận thanh toán' },
            { label: 'Doanh thu tháng này', value: formatCurrency(metrics.monthly_revenue || 0), note: 'Từ booking liên kết' },
            { label: 'Tour liên kết', value: metrics.linked_tours ?? 0, note: 'Tour đang gắn với đối tác' },
            { label: 'Đơn đang mở', value: metrics.outstanding_orders ?? 0, note: 'Cần theo dõi/hoàn tất' },
            { label: 'Dịch vụ đang mở', value: metrics.active_services ?? 0, note: 'Có thể bán ngay' },
            { label: 'Dịch vụ ngưng', value: metrics.inactive_services ?? 0, note: 'Đang tạm dừng' },
          ].map((item) => (
            <div className="col-md-6 col-xl-2" key={item.label}>
              <div className="h-100 rounded-4 border bg-light p-3">
                <div className="small text-muted mb-2">{item.label}</div>
                <div className="fw-semibold mb-1">{item.value}</div>
                <div className="small text-muted">{item.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Hồ sơ đối tác</h3>
            <Formik
              enableReinitialize
              initialValues={{
                company_name: profile.company_name || '',
                service_type: profile.service_type || 'hotel',
                status: profile.status || 'active',
                contact_info: {
                  contact_name: profile.contact_info?.contact_name || '',
                  email: profile.contact_info?.email || '',
                  phone: profile.contact_info?.phone || '',
                  address: profile.contact_info?.address || '',
                  business_license: profile.contact_info?.business_license || '',
                  facility_images: profile.contact_info?.facility_images || [],
                },
              }}
              onSubmit={(values) => {
                const payload = new FormData();
                payload.append('company_name', values.company_name);
                payload.append('service_type', values.service_type);
                payload.append('status', values.status);
                payload.append('contact_info[contact_name]', values.contact_info.contact_name || '');
                payload.append('contact_info[email]', values.contact_info.email || '');
                payload.append('contact_info[phone]', values.contact_info.phone || '');
                payload.append('contact_info[address]', values.contact_info.address || '');
                payload.append('contact_info[business_license]', values.contact_info.business_license || '');
                (values.contact_info.facility_images || []).forEach((item, index) => {
                  payload.append(`contact_info[facility_images][${index}]`, item);
                });

                if (businessLicenseFile) {
                  payload.append('business_license_file', businessLicenseFile);
                }

                facilityImageFiles.forEach((file) => payload.append('facility_image_files[]', file));

                profileMutation.mutate(payload);
              }}
            >
              {({ values }) => (
                <Form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Tên công ty</label>
                      <Field name="company_name" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Loại dịch vụ</label>
                      <Field as="select" name="service_type" className="form-select">
                        <option value="hotel">Khách sạn</option>
                        <option value="transport">Vận chuyển</option>
                        <option value="airline">Vé máy bay</option>
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Người liên hệ</label>
                      <Field name="contact_info.contact_name" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <Field name="contact_info.email" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Số điện thoại</label>
                      <Field name="contact_info.phone" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Trạng thái hồ sơ</label>
                      <Field as="select" name="status" className="form-select">
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Tạm ngưng</option>
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Giấy phép kinh doanh</label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="form-control" onChange={(e) => setBusinessLicenseFile(e.currentTarget.files?.[0] || null)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Hoặc dán link giấy phép</label>
                      <Field name="contact_info.business_license" className="form-control" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Địa chỉ</label>
                      <Field name="contact_info.address" className="form-control" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ảnh cơ sở từ máy</label>
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="form-control" onChange={(e) => setFacilityImageFiles(Array.from(e.currentTarget.files || []))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Link ảnh cơ sở hiện có</label>
                      <div className="d-grid gap-2">
                        {(values.contact_info.facility_images || []).map((_, index) => (
                          <Field key={index} name={`contact_info.facility_images.${index}`} className="form-control" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-4" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <div className="d-flex flex-column gap-3 flex-md-row justify-content-between mb-3">
              <div>
                <h3 className="h5 mb-1">{selectedService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h3>
                <p className="mb-0 text-muted">Thêm/sửa dịch vụ, bật tắt trạng thái, và giữ catalog luôn sạch.</p>
              </div>
              {selectedService ? (
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedService(null)}>
                  Hủy chỉnh sửa
                </button>
              ) : null}
            </div>

            <Formik
              enableReinitialize
              initialValues={{
                ...emptyServiceForm,
                ...(selectedService || {}),
                price: selectedService?.price ?? '',
                available_quantity: selectedService?.available_quantity ?? 0,
              }}
              onSubmit={(values, helpers) => {
                const payload = {
                  ...values,
                  price: Number(values.price),
                  available_quantity: Number(values.available_quantity),
                };

                serviceMutation.mutate(
                  { id: selectedService?.id, payload },
                  {
                    onSuccess: () => {
                      helpers.resetForm();
                      setSelectedService(null);
                    },
                  },
                );
              }}
            >
              {({ values }) => (
                <Form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Tên dịch vụ</label>
                      <Field name="name" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nhóm dịch vụ</label>
                      <Field as="select" name="service_category" className="form-select">
                        <option value="hotel">Khách sạn</option>
                        <option value="transport">Vận chuyển</option>
                        <option value="airline">Vé máy bay</option>
                        <option value="ticket">Vé tham quan</option>
                        <option value="other">Khác</option>
                      </Field>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Giá</label>
                      <Field name="price" type="number" className="form-control" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Đơn vị</label>
                      <Field name="unit" className="form-control" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Số lượng sẵn có</label>
                      <Field name="available_quantity" type="number" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Trạng thái</label>
                      <Field as="select" name="status" className="form-select">
                        <option value="active">Đang mở</option>
                        <option value="inactive">Ngưng</option>
                      </Field>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ghi chú giá</label>
                      <Field name="pricing_note" className="form-control" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Chính sách hủy</label>
                      <Field as="textarea" rows="3" name="cancellation_policy" className="form-control" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-4" disabled={serviceMutation.isPending}>
                    {serviceMutation.isPending ? 'Đang lưu...' : selectedService ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="row g-3 mt-4">
              <div className="col-md-6">
                <input
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, nhóm dịch vụ, ghi chú..."
                />
              </div>
              <div className="col-md-3">
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Đang mở</option>
                  <option value="inactive">Ngưng</option>
                </select>
              </div>
              <div className="col-md-3 text-md-end align-self-center small text-muted">
                {filteredServices.length} dịch vụ
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <div>
            <h3 className="h5 mb-1">Danh mục dịch vụ hiện có</h3>
            <p className="mb-0 text-muted">Quản lý trạng thái, chỉnh sửa hoặc xóa từng dịch vụ.</p>
          </div>
          <div className="small text-muted align-self-md-center">
            {breakdown.service_categories?.length ? `${breakdown.service_categories.length} nhóm dịch vụ` : 'Chưa có thống kê nhóm dịch vụ'}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-muted">Đang tải dịch vụ...</td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-muted">Chưa có dịch vụ nào phù hợp.</td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div className="fw-semibold">{service.name}</div>
                      <div className="small text-muted text-break">{service.pricing_note || '--'}</div>
                    </td>
                    <td className="text-capitalize">{service.service_category}</td>
                    <td>{formatCurrency(service.price)}</td>
                    <td>{service.available_quantity} {service.unit}</td>
                    <td>
                      <span className={`badge ${serviceStatusBadges[service.status] || 'bg-secondary'}`}>
                        {serviceStatusLabel(service.status)}
                      </span>
                    </td>
                    <td>{formatDate(service.updated_at || service.created_at)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setSelectedService(service)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(service.id)}
                        >
                          {service.status === 'active' ? 'Ngưng' : 'Mở'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Xóa dịch vụ "${service.name}"?`)) {
                              deleteMutation.mutate(service.id);
                            }
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Tour liên kết dịch vụ</h3>
            <div className="d-grid gap-3">
              {linkedTours.map((tour) => (
                <div key={tour.id} className="rounded-3 border p-3">
                  <div className="fw-semibold">{tour.title}</div>
                  <div className="small text-muted mb-1">{tour.destination}</div>
                  <div className="small text-muted">Cập nhật: {formatDate(tour.updated_at)}</div>
                </div>
              ))}
              {linkedTours.length === 0 && <div className="text-muted">Chưa có tour nào liên kết với đối tác này.</div>}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Đơn dịch vụ phát sinh</h3>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Khách</th>
                    <th>Ngày đi</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.tour?.title || '--'}</td>
                      <td>{order.customer?.name || '--'}</td>
                      <td>{formatDate(order.departure_date)}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                  {serviceOrders.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-muted">
                        Chưa có đơn dịch vụ nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Đơn gần đây</h3>
            <div className="d-grid gap-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-3 bg-light p-3">
                  <div className="d-flex justify-content-between gap-2">
                    <strong>{order.tour?.title || '--'}</strong>
                    <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
                  </div>
                  <div className="small text-muted">{order.customer?.name || '--'} • {formatDate(order.departure_date)}</div>
                </div>
              ))}
              {recentOrders.length === 0 && <div className="text-muted">Chưa có đơn gần đây.</div>}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Tour liên kết gần đây</h3>
            <div className="d-grid gap-3">
              {recentLinkedTours.map((tour) => (
                <div key={tour.id} className="rounded-3 border p-3">
                  <div className="d-flex justify-content-between gap-2">
                    <div>
                      <div className="fw-semibold">{tour.title}</div>
                      <div className="small text-muted">{tour.destination}</div>
                    </div>
                    <span className="badge bg-light text-dark text-capitalize">{tour.status}</span>
                  </div>
                  <div className="small text-muted mt-2">Fill rate: {tour.fill_rate ?? '--'}%</div>
                </div>
              ))}
              {recentLinkedTours.length === 0 && <div className="text-muted">Chưa có tour liên kết gần đây.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
