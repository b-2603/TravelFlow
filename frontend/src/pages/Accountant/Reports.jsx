import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { paymentAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: reportPayload, isLoading: reportLoading } = useQuery({
    queryKey: ['accountant-report', month],
    queryFn: async () => (await paymentAPI.financeReport({ month })).data?.data ?? {},
  });

  const { data: liabilitiesPayload, isLoading: liabilitiesLoading } = useQuery({
    queryKey: ['partner-liabilities'],
    queryFn: async () => (await paymentAPI.partnerLiabilities()).data?.data ?? {},
  });

  const exportMutation = useMutation({
    mutationFn: ({ format }) => paymentAPI.exportFinanceReport({ month, format }),
    onSuccess: (response, variables) => {
      const extension = variables.format === 'pdf' ? 'pdf' : 'csv';
      downloadBlob(response.data, `bao-cao-tai-chinh-${month}.${extension}`);
      toast.success(`Đã xuất báo cáo ${variables.format.toUpperCase()}`);
    },
    onError: () => toast.error('Không thể xuất báo cáo lúc này.'),
  });

  const report = reportPayload?.summary || {};
  const breakdown = reportPayload?.breakdown || {};
  const trend = reportPayload?.monthly_trend || [];
  const liabilities = liabilitiesPayload?.items || [];
  const liabilitySummary = liabilitiesPayload?.summary || {};
  const paymentMethods = breakdown?.payment_methods || [];
  const paymentStatuses = breakdown?.payment_statuses || [];
  const refundStatuses = breakdown?.refund_statuses || [];

  const statCards = [
    { label: 'Doanh thu kỳ này', value: formatCurrency(report.revenue || 0) },
    { label: 'Hoàn tiền', value: formatCurrency(report.refund_total || 0) },
    { label: 'Chi phí đối tác', value: formatCurrency(report.service_cost || 0) },
    { label: 'Lợi nhuận ước tính', value: formatCurrency(report.profit || 0) },
  ];

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between align-items-lg-end">
          <div>
            <h2 className="h4 mb-1">Báo cáo tài chính</h2>
            <p className="mb-0 text-muted">
              Tổng hợp doanh thu, hoàn tiền, chi phí dịch vụ và hiệu quả vận hành theo từng kỳ.
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2">
            <div>
              <label className="form-label">Chọn kỳ báo cáo</label>
              <input type="month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="d-flex gap-2 align-items-end">
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate({ format: 'csv' })}
              >
                Xuất CSV
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate({ format: 'pdf' })}
              >
                Xuất PDF
              </button>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {statCards.map((item) => (
            <div className="col-md-6 col-xl-3" key={item.label}>
              <div className="rounded-4 border bg-light-subtle p-3 h-100">
                <div className="small text-muted mb-2">{item.label}</div>
                <div className="fs-5 fw-semibold">{reportLoading ? 'Đang tải...' : item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="rounded-4 border h-100 p-3">
              <div className="small text-muted mb-2">Số booking trong kỳ</div>
              <div className="fs-4 fw-semibold">{reportLoading ? '--' : report.bookings_count ?? 0}</div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="rounded-4 border h-100 p-3">
              <div className="small text-muted mb-2">Yêu cầu hoàn tiền</div>
              <div className="fs-4 fw-semibold">{reportLoading ? '--' : report.refund_requests_count ?? 0}</div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="rounded-4 border h-100 p-3">
              <div className="small text-muted mb-2">Biên lợi nhuận tạm tính</div>
              <div className="fs-4 fw-semibold">
                {reportLoading ? '--' : `${(((report.profit || 0) / Math.max(report.revenue || 1, 1)) * 100).toFixed(1)}%`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="h5 mb-1">Breakdown giao dịch</h3>
          <p className="mb-0 text-muted">Phân tích theo phương thức, trạng thái thanh toán và hoàn tiền.</p>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div className="rounded-4 border p-3 h-100">
              <div className="fw-semibold mb-2">Phương thức thanh toán</div>
              <div className="small text-muted mb-2">Tỷ trọng theo kỳ đang xem</div>
              {paymentMethods.length === 0 ? <div className="small text-muted">Chưa có dữ liệu.</div> : (
                <ul className="list-unstyled mb-0">
                  {paymentMethods.map((item) => (
                    <li key={item.method} className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-uppercase">{item.method}</span>
                      <span className="fw-semibold">{formatCurrency(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="col-lg-4">
            <div className="rounded-4 border p-3 h-100">
              <div className="fw-semibold mb-2">Trạng thái thanh toán</div>
              <div className="small text-muted mb-2">Đếm theo giao dịch phát sinh</div>
              {paymentStatuses.length === 0 ? <div className="small text-muted">Chưa có dữ liệu.</div> : (
                <ul className="list-unstyled mb-0">
                  {paymentStatuses.map((item) => (
                    <li key={item.status} className="d-flex justify-content-between py-1 border-bottom">
                      <span>{item.status}</span>
                      <span className="fw-semibold">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="col-lg-4">
            <div className="rounded-4 border p-3 h-100">
              <div className="fw-semibold mb-2">Trạng thái hoàn tiền</div>
              <div className="small text-muted mb-2">Theo yêu cầu trong kỳ</div>
              {refundStatuses.length === 0 ? <div className="small text-muted">Chưa có dữ liệu.</div> : (
                <ul className="list-unstyled mb-0">
                  {refundStatuses.map((item) => (
                    <li key={item.status} className="d-flex justify-content-between py-1 border-bottom">
                      <span>{item.status}</span>
                      <span className="fw-semibold">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
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
              ) : trend.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.refunds)}</td>
                  <td>{item.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column gap-2">
          <h3 className="h5 mb-0">Công nợ đối tác</h3>
          <p className="mb-0 text-muted">
            Ước tính phần cần thanh toán cho đối tác dựa trên booking đã xác nhận hoặc hoàn thành.
          </p>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="rounded-4 border bg-light-subtle p-3">
              <div className="small text-muted mb-2">Tổng phải trả</div>
              <div className="fs-5 fw-semibold">{formatCurrency(liabilitySummary.total_payable || 0)}</div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="rounded-4 border bg-light-subtle p-3">
              <div className="small text-muted mb-2">Còn phải thanh toán</div>
              <div className="fs-5 fw-semibold">{formatCurrency(liabilitySummary.total_outstanding || 0)}</div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Đối tác</th>
                <th>Loại dịch vụ</th>
                <th>Đơn đã xác nhận</th>
                <th>Phải trả</th>
                <th>Đã trả</th>
                <th>Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {liabilitiesLoading ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-muted">
                    Đang tải công nợ đối tác...
                  </td>
                </tr>
              ) : liabilities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-muted">
                    Chưa có dữ liệu công nợ đối tác.
                  </td>
                </tr>
              ) : (
                liabilities.map((item) => (
                  <tr key={item.partner_id}>
                    <td>{item.company_name}</td>
                    <td>{item.service_type}</td>
                    <td>{item.confirmed_orders}</td>
                    <td>{formatCurrency(item.payable_amount)}</td>
                    <td>{formatCurrency(item.paid_amount)}</td>
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
