import { Formik, Form, Field } from 'formik';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { partnerAPI } from '../../services/api';
import { formatCurrency, formatDate, statusBadgeClass } from '../../utils/formatters';

export default function Services() {
  const queryClient = useQueryClient();
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [facilityImageFiles, setFacilityImageFiles] = useState([]);

  const { data: payload } = useQuery({
    queryKey: ['partner-services'],
    queryFn: async () => (await partnerAPI.services()).data?.data ?? {},
  });

  const profile = payload?.profile;
  const services = payload?.services || [];
  const linkedTours = payload?.linked_tours || [];
  const serviceOrders = payload?.service_orders || [];
  const metrics = payload?.metrics || {};

  const profileMutation = useMutation({
    mutationFn: (values) => partnerAPI.updateProfile(values),
    onSuccess: () => {
      toast.success('Cập nhật hồ sơ đối tác thành công');
      setBusinessLicenseFile(null);
      setFacilityImageFiles([]);
      queryClient.invalidateQueries({ queryKey: ['partner-services'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể cập nhật hồ sơ đối tác'),
  });

  const serviceMutation = useMutation({
    mutationFn: (values) => partnerAPI.createService(values),
    onSuccess: () => {
      toast.success('Đã thêm dịch vụ đối tác');
      queryClient.invalidateQueries({ queryKey: ['partner-services'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể tạo dịch vụ đối tác'),
  });

  return (
    <div className="d-grid gap-4">
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <h2 className="h4 mb-1">Cổng đối tác dịch vụ</h2>
        <p className="mb-0 text-muted">Quản lý hồ sơ công ty, danh mục dịch vụ, tour liên kết và doanh thu hợp tác.</p>
      </div>

      <div className="row g-3">
        {[
          { label: 'Giao dịch thành công', value: metrics.successful_payments ?? 0 },
          { label: 'Doanh thu tháng này', value: formatCurrency(metrics.monthly_revenue || 0) },
          { label: 'Tour liên kết', value: metrics.linked_tours ?? 0 },
          { label: 'Đơn dịch vụ đang mở', value: metrics.outstanding_orders ?? 0 },
        ].map((item) => (
          <div className="col-md-6 col-xl-3" key={item.label}>
            <div className="h-100 rounded-4 border bg-light p-3">
              <div className="small text-muted">{item.label}</div>
              <div className="fw-semibold">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Hồ sơ đối tác</h3>
            <Formik
              enableReinitialize
              initialValues={{
                company_name: profile?.company_name || '',
                service_type: profile?.service_type || 'hotel',
                status: profile?.status || 'active',
                contact_info: {
                  contact_name: profile?.contact_info?.contact_name || '',
                  email: profile?.contact_info?.email || '',
                  phone: profile?.contact_info?.phone || '',
                  address: profile?.contact_info?.address || '',
                  business_license: profile?.contact_info?.business_license || '',
                  facility_images: profile?.contact_info?.facility_images || [],
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

        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Thêm dịch vụ mới</h3>
            <Formik
              initialValues={{
                name: '',
                service_category: 'hotel',
                price: '',
                unit: 'đơn vị',
                available_quantity: 0,
                pricing_note: '',
                status: 'active',
                cancellation_policy: '',
              }}
              onSubmit={(values, helpers) => {
                serviceMutation.mutate(
                  { ...values, price: Number(values.price), available_quantity: Number(values.available_quantity) },
                  { onSuccess: () => helpers.resetForm() }
                );
              }}
            >
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
                  {serviceMutation.isPending ? 'Đang thêm...' : 'Thêm dịch vụ'}
                </button>
              </Form>
            </Formik>
          </div>
        </div>
      </div>

      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <h3 className="h5 mb-3">Danh mục dịch vụ hiện có</h3>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="fw-semibold">{service.name}</div>
                    <div className="small text-muted">{service.pricing_note || '--'}</div>
                  </td>
                  <td>{service.service_category}</td>
                  <td>{formatCurrency(service.price)}</td>
                  <td>{service.available_quantity} {service.unit}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(service.status === 'active' ? 'completed' : 'cancelled')}`}>
                      {service.status === 'active' ? 'Đang mở' : 'Ngưng'}
                    </span>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-muted">
                    Chưa có dịch vụ nào được khai báo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <h3 className="h5 mb-3">Tour liên kết dịch vụ</h3>
            <div className="d-grid gap-3">
              {linkedTours.map((tour) => (
                <div key={tour.id} className="rounded-3 border p-3">
                  <div className="fw-semibold">{tour.title}</div>
                  <div className="small text-muted mb-1">{tour.destination}</div>
                  <div className="small">Ngày cập nhật: {formatDate(tour.updated_at)}</div>
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
    </div>
  );
}
