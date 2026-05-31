import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { partnerAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-4 border bg-light-subtle p-3 h-100">
      <div className="small text-muted mb-2">{label}</div>
      <div className="fs-5 fw-semibold mb-1">{value}</div>
      {note ? <div className="small text-muted">{note}</div> : null}
    </div>
  );
}

export default function PartnerDashboard() {
  const { data: payload = {}, isLoading } = useQuery({
    queryKey: ['partner-dashboard'],
    queryFn: async () => (await partnerAPI.dashboard()).data?.data ?? {},
  });

  const profile = payload?.profile || {};
  const metrics = payload?.metrics || {};
  const breakdown = payload?.breakdown || {};
  const recentOrders = payload?.recent_orders || [];
  const recentTours = payload?.recent_linked_tours || [];
  const profileCompletion = payload?.profile_completion ?? 0;

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
          <div>
            <h2 className="h4 mb-1">Tổng quan đối tác dịch vụ</h2>
            <p className="mb-0 text-muted">Theo dõi trạng thái hồ sơ, hiệu quả dịch vụ và các đơn phát sinh từ tour liên kết.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/partner/services" className="btn btn-primary btn-sm">
              Quản lý dịch vụ
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary btn-sm">
              Cập nhật hồ sơ
            </Link>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-xl-3">
            <StatCard label="Doanh thu tháng này" value={formatCurrency(metrics.monthly_revenue || 0)} note="Từ giao dịch đã xác nhận" />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Tour liên kết" value={metrics.linked_tours ?? 0} note="Tour đang gắn với đối tác" />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Đơn dịch vụ" value={metrics.service_orders ?? 0} note="Tổng booking phát sinh từ tour liên kết" />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Hồ sơ hoàn thiện" value={`${profileCompletion}%`} note="Mức hoàn thiện của hồ sơ đối tác" />
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Công ty</div>
              <div className="fw-semibold">{profile.company_name || '--'}</div>
              <div className="small text-muted">{profile.service_type || '--'}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Người liên hệ</div>
              <div className="fw-semibold">{profile.contact_info?.contact_name || profile.user?.name || '--'}</div>
              <div className="small text-muted">{profile.user?.email || profile.contact_info?.email || '--'}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Trạng thái</div>
              <div className="fw-semibold text-capitalize">{profile.status || '--'}</div>
              <div className="small text-muted">{profile.contact_info?.address || '--'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-4 border bg-light-subtle p-3 mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="small text-muted">Mức hoàn thiện hồ sơ</div>
            <div className="fw-semibold">{profileCompletion}%</div>
          </div>
          <div className="progress" style={{ height: 10 }}>
            <div className="progress-bar" role="progressbar" style={{ width: `${profileCompletion}%` }} aria-valuenow={profileCompletion} aria-valuemin="0" aria-valuemax="100" />
          </div>
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="h5 mb-1">Tình trạng dịch vụ</h3>
          <p className="mb-0 text-muted">Số lượng dịch vụ đang mở/đang ngưng và phân theo nhóm dịch vụ.</p>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-xl-3">
            <StatCard label="Dịch vụ đang mở" value={metrics.active_services ?? 0} />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Dịch vụ ngưng" value={metrics.inactive_services ?? 0} />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Đơn đang mở" value={metrics.outstanding_orders ?? 0} />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Giao dịch thành công" value={metrics.successful_payments ?? 0} />
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-6">
            <div className="rounded-4 border p-3 h-100">
              <div className="fw-semibold mb-3">Theo trạng thái</div>
              <div className="d-grid gap-2">
                {(breakdown.service_statuses || []).map((item) => (
                  <div key={item.status} className="d-flex justify-content-between align-items-center border-bottom py-2">
                    <span className="text-capitalize">{item.status}</span>
                    <span className="fw-semibold">{item.count}</span>
                  </div>
                ))}
                {(breakdown.service_statuses || []).length === 0 ? <div className="text-muted">Chưa có dữ liệu.</div> : null}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="rounded-4 border p-3 h-100">
              <div className="fw-semibold mb-3">Theo nhóm dịch vụ</div>
              <div className="d-grid gap-2">
                {(breakdown.service_categories || []).map((item) => (
                  <div key={item.category} className="d-flex justify-content-between align-items-center border-bottom py-2">
                    <span className="text-capitalize">{item.category}</span>
                    <span className="fw-semibold">{item.count} dịch vụ</span>
                  </div>
                ))}
                {(breakdown.service_categories || []).length === 0 ? <div className="text-muted">Chưa có dữ liệu.</div> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-6">
          <section className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h5 mb-1">Đơn dịch vụ gần đây</h3>
                <p className="mb-0 text-muted">Các booking phát sinh từ tour liên kết gần nhất.</p>
              </div>
              <Link to="/partner/services" className="btn btn-sm btn-outline-primary">Mở dịch vụ</Link>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Khách</th>
                    <th>Ngày đi</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-muted">Đang tải dữ liệu...</td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-muted">Chưa có đơn dịch vụ.</td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.tour?.title || '--'}</td>
                        <td>{order.customer?.name || '--'}</td>
                        <td>{formatDate(order.departure_date)}</td>
                        <td className="text-capitalize">{order.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="col-lg-6">
          <section className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h5 mb-1">Tour liên kết gần đây</h3>
                <p className="mb-0 text-muted">Các tour đang kéo doanh thu cho đối tác.</p>
              </div>
              <Link to="/partner/services" className="btn btn-sm btn-outline-primary">Quản lý dịch vụ</Link>
            </div>

            <div className="d-grid gap-3">
              {isLoading ? (
                <div className="py-4 text-center text-muted">Đang tải dữ liệu...</div>
              ) : recentTours.length === 0 ? (
                <div className="py-4 text-center text-muted">Chưa có tour liên kết.</div>
              ) : (
                recentTours.map((tour) => (
                  <div key={tour.id} className="rounded-3 border p-3">
                    <div className="d-flex justify-content-between gap-2">
                      <div>
                        <div className="fw-semibold">{tour.title}</div>
                        <div className="small text-muted">{tour.destination}</div>
                      </div>
                      <span className="badge bg-light text-dark text-capitalize">{tour.status}</span>
                    </div>
                    <div className="small text-muted mt-2">
                      Fill rate: {tour.fill_rate ?? '--'}% • Cập nhật: {formatDate(tour.updated_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
