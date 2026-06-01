import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { accountantAPI } from '../../services/api';
import {
  formatCurrency,
  formatDate,
  paymentStatusLabel,
  refundStatusLabel,
  statusBadgeClass,
} from '../../utils/formatters';

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-4 border bg-light-subtle p-3 h-100">
      <div className="small text-muted mb-2">{label}</div>
      <div className="fs-5 fw-semibold mb-1">{value}</div>
      {note ? <div className="small text-muted">{note}</div> : null}
    </div>
  );
}

export default function AccountantDashboard() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: payload = {}, isFetching, isError } = useQuery({
    queryKey: ['accountant-dashboard', month],
    queryFn: async () => (await accountantAPI.dashboard({ month })).data?.data ?? {},
  });

  const summary = payload?.summary || {};
  const breakdown = payload?.breakdown || {};
  const trend = breakdown?.monthly_trend || [];
  const recentPayments = payload?.recent_payments || [];
  const recentRefunds = payload?.recent_refunds || [];
  const liabilities = payload?.liabilities || [];

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column gap-3 flex-xl-row justify-content-between align-items-xl-end mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="h4 mb-0">Tổng quan kế toán / tài chính</h2>
              {isFetching ? <span className="badge text-bg-light border">Đang cập nhật</span> : null}
            </div>
            <p className="mb-0 text-muted">
              Theo dõi dòng tiền, yêu cầu hoàn tiền, công nợ đối tác và các giao dịch cần xử lý trong tháng.
            </p>
          </div>

          <div>
            <label className="form-label">Chọn kỳ</label>
            <input type="month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>

        {isError ? (
          <div className="alert alert-warning mb-4">
            Không tải được dữ liệu kế toán. Vui lòng kiểm tra kết nối hoặc đăng nhập lại.
          </div>
        ) : null}

        <div className="row g-3">
          <div className="col-md-6 col-xl-3"><StatCard label="Doanh thu" value={formatCurrency(summary.revenue || 0)} note="Tổng giao dịch thành công trong kỳ" /></div>
          <div className="col-md-6 col-xl-3"><StatCard label="Hoàn tiền" value={formatCurrency(summary.refund_total || 0)} note="Các giao dịch đã hoàn" /></div>
          <div className="col-md-6 col-xl-3"><StatCard label="Chi phí đối tác" value={formatCurrency(summary.service_cost || 0)} note="Ước tính nghĩa vụ thanh toán" /></div>
          <div className="col-md-6 col-xl-3"><StatCard label="Lợi nhuận ước tính" value={formatCurrency(summary.profit || 0)} note="Doanh thu trừ hoàn tiền và chi phí" /></div>
          <div className="col-md-6 col-xl-3"><StatCard label="Net revenue" value={formatCurrency(summary.net_revenue || 0)} note="Doanh thu thực thu sau hoàn" /></div>
          <div className="col-md-6 col-xl-3"><StatCard label="Thanh toán chờ xử lý" value={summary.pending_payments_count ?? 0} note="Cần đối soát/xác nhận" /></div>
          <div className="col-md-6 col-xl-3"><StatCard label="Yêu cầu hoàn tiền" value={summary.refund_requests_count ?? 0} note="Tất cả yêu cầu trong kỳ" /></div>
          <div className="col-md-6 col-xl-3"><StatCard label="Booking trong kỳ" value={summary.bookings_count ?? 0} note="Phục vụ báo cáo vận hành" /></div>
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
          <div>
            <h3 className="h5 mb-1">Xu hướng 6 tháng</h3>
            <p className="mb-0 text-muted">So sánh doanh thu, hoàn tiền và số yêu cầu phát sinh theo từng tháng.</p>
          </div>
          <div className="small text-muted align-self-lg-end">Kỳ đang xem: {month || '--'}</div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Doanh thu</th>
                <th>Hoàn tiền</th>
                <th>Yêu cầu hoàn tiền</th>
              </tr>
            </thead>
            <tbody>
              {trend.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-muted">Chưa có dữ liệu xu hướng.</td>
                </tr>
              ) : (
                trend.map((item) => (
                  <tr key={item.label}>
                    <td>{item.label}</td>
                    <td>{formatCurrency(item.revenue)}</td>
                    <td>{formatCurrency(item.refunds)}</td>
                    <td>{item.requests}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-6">
          <section className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h5 mb-1">Thanh toán gần đây</h3>
                <p className="mb-0 text-muted">Các giao dịch mới nhất cần theo dõi.</p>
              </div>
              <Link to="/accountant/payments" className="btn btn-sm btn-outline-primary">Mở danh sách</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Giao dịch</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-muted">Chưa có giao dịch gần đây.</td>
                    </tr>
                  ) : (
                    recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.paid_at || payment.created_at)}</td>
                        <td className="text-break">
                          <div className="fw-semibold">{payment.booking?.tour?.title || payment.transaction_id}</div>
                          <div className="small text-muted">{payment.booking?.user?.name || '--'}</div>
                        </td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td><span className={`badge ${statusBadgeClass(payment.status)}`}>{paymentStatusLabel(payment.status)}</span></td>
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
                <h3 className="h5 mb-1">Hoàn tiền gần đây</h3>
                <p className="mb-0 text-muted">Yêu cầu cần duyệt hoặc xác nhận đã hoàn.</p>
              </div>
              <Link to="/accountant/refunds" className="btn btn-sm btn-outline-primary">Mở danh sách</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Ngày gửi</th>
                    <th>Booking</th>
                    <th>Yêu cầu</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRefunds.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-muted">Chưa có yêu cầu hoàn tiền gần đây.</td>
                    </tr>
                  ) : (
                    recentRefunds.map((refund) => (
                      <tr key={refund.id}>
                        <td>{formatDate(refund.created_at)}</td>
                        <td className="text-break">
                          <div className="fw-semibold">{refund.booking?.tour?.title || refund.booking_id}</div>
                          <div className="small text-muted">{refund.booking?.user?.name || '--'}</div>
                        </td>
                        <td>{formatCurrency(refund.amount_requested)}</td>
                        <td><span className={`badge ${statusBadgeClass(refund.status)}`}>{refundStatusLabel(refund.status)}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
          <div>
            <h3 className="h5 mb-1">Công nợ đối tác ưu tiên</h3>
            <p className="mb-0 text-muted">Các khoản phải thanh toán nhiều nhất theo đối tác.</p>
          </div>
          <Link to="/accountant/reports" className="btn btn-sm btn-outline-primary">Xem báo cáo</Link>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Đối tác</th>
                <th>Dịch vụ</th>
                <th>Đơn xác nhận</th>
                <th>Phải trả</th>
                <th>Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {liabilities.slice(0, 5).length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-muted">Chưa có công nợ đối tác.</td>
                </tr>
              ) : (
                liabilities.slice(0, 5).map((item) => (
                  <tr key={item.partner_id}>
                    <td>{item.company_name}</td>
                    <td>{item.service_type}</td>
                    <td>{item.confirmed_orders}</td>
                    <td>{formatCurrency(item.payable_amount)}</td>
                    <td className="fw-semibold">{formatCurrency(item.outstanding_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
