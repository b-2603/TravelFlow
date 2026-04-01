import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function AgentCustomers() {
  const [keyword, setKeyword] = useState('');

  const { data: payload } = useQuery({
    queryKey: ['agent-customers', keyword],
    queryFn: async () => (await agentAPI.customers(keyword ? { q: keyword } : {})).data?.data ?? {},
  });

  const customers = payload?.items || [];

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column gap-3 flex-md-row justify-content-between align-items-md-center">
        <div>
          <h2 className="h4 mb-1">Khách hàng</h2>
          <p className="mb-0 text-muted">Tra cứu khách để tư vấn, xem lịch sử cơ bản và tạo booking thay.</p>
        </div>
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          placeholder="Tìm theo tên, email, SĐT..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Liên hệ</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <div className="fw-semibold">{customer.name}</div>
                  <div className="small text-muted">@{customer.username}</div>
                </td>
                <td>
                  <div>{customer.email}</div>
                  <div className="small text-muted">{customer.phone || '--'}</div>
                </td>
                <td>{formatDate(customer.created_at)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="3" className="py-4 text-center text-muted">
                  Chưa tìm thấy khách hàng phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
