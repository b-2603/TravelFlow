import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountantAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import DateInput from '../../components/DateInput';

export default function AccountantLogs() {
  const [filters, setFilters] = useState({ user: '', module: 'payments', date: '', search: '' });
  const [page, setPage] = useState(1);

  const { data: payload } = useQuery({
    queryKey: ['accountant-logs', filters, page],
    queryFn: async () => (await accountantAPI.logs({ ...filters, page })).data?.data ?? {},
  });

  const logs = payload?.items || [];
  const summary = payload?.summary || {};

  const exportCsv = () => {
    const header = ['thoi_gian', 'user_id', 'hanh_dong', 'phan_he', 'ip_address', 'detail'];
    const rows = logs.map((log) => [log.created_at, log.user_id, log.action, log.module, log.ip_address, JSON.stringify(log.detail || {})]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${value ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nhat-ky-ke-toan.csv';
    link.click();
  };

  return (
    <div className="bg-white border rounded-4 p-4 shadow-sm">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h4 mb-1">Nhật ký kế toán</h2>
          <p className="text-muted mb-0">Theo dõi thao tác thu, đối soát và hoàn tiền.</p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={exportCsv}>
          Xuất CSV
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6 col-xl-3"><div className="rounded-4 border bg-light-subtle p-3 h-100"><div className="small text-muted mb-2">Tổng log</div><div className="fs-5 fw-semibold">{summary.total ?? 0}</div></div></div>
        <div className="col-md-6 col-xl-3"><div className="rounded-4 border bg-light-subtle p-3 h-100"><div className="small text-muted mb-2">payments</div><div className="fs-5 fw-semibold">{summary.payments ?? 0}</div></div></div>
        <div className="col-md-6 col-xl-3"><div className="rounded-4 border bg-light-subtle p-3 h-100"><div className="small text-muted mb-2">refunds</div><div className="fs-5 fw-semibold">{summary.refunds ?? 0}</div></div></div>
        <div className="col-md-6 col-xl-3"><div className="rounded-4 border bg-light-subtle p-3 h-100"><div className="small text-muted mb-2">emails</div><div className="fs-5 fw-semibold">{summary.emails ?? 0}</div></div></div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Nhập ID người dùng"
            value={filters.user}
            onChange={(e) => {
              setPage(1);
              setFilters((v) => ({ ...v, user: e.target.value }));
            }}
          />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={filters.module} onChange={(e) => {
            setPage(1);
            setFilters((v) => ({ ...v, module: e.target.value }));
          }}>
            <option value="">Tất cả phân hệ</option>
            <option value="payments">payments</option>
            <option value="refunds">refunds</option>
            <option value="bookings">bookings</option>
            <option value="emails">emails</option>
            <option value="tours">tours</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div className="col-md-4">
          <DateInput className="form-control" value={filters.date} onChange={(value) => {
            setPage(1);
            setFilters((v) => ({ ...v, date: value }));
          }} />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <input
            className="form-control"
            placeholder="Tìm theo hành động, phân hệ hoặc IP..."
            value={filters.search}
            onChange={(e) => {
              setPage(1);
              setFilters((v) => ({ ...v, search: e.target.value }));
            }}
          />
        </div>
        <div className="col-lg-4 d-flex gap-2 justify-content-lg-end">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={(payload?.pagination?.current_page || 1) <= 1}>
            Trước
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setPage((value) => value + 1)}
            disabled={payload?.pagination?.current_page >= payload?.pagination?.last_page}
          >
            Sau
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th>Hành động</th>
              <th>Phân hệ</th>
              <th>IP</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-muted">
                  Chưa có log phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.created_at)}</td>
                  <td>{log.user_id || '--'}</td>
                  <td className="text-break">{log.action}</td>
                  <td>{log.module}</td>
                  <td>{log.ip_address}</td>
                  <td className="small text-muted text-break" style={{ minWidth: 220 }}>{JSON.stringify(log.detail || {})}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
