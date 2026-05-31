import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { agentAPI } from '../../services/api';
import { formatDate, supportStatusLabel } from '../../utils/formatters';

function priorityLabel(priority) {
  const map = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    urgent: 'Khẩn cấp',
  };

  return map[priority] || priority || '--';
}

function statusClass(status) {
  if (status === 'open') return 'bg-warning text-dark';
  if (status === 'in_progress') return 'bg-primary';
  if (status === 'closed') return 'bg-secondary';
  return 'bg-light text-dark';
}

export default function AgentSupportTickets() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');

  const { data: payload } = useQuery({
    queryKey: ['agent-support-tickets', filters],
    queryFn: async () => (await agentAPI.supportTickets(filters)).data?.data ?? {},
  });

  const tickets = payload?.items || [];

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, payload }) => agentAPI.replySupportTicket(ticketId, payload),
    onSuccess: () => {
      toast.success('Đã phản hồi ticket hỗ trợ');
      setSelectedTicket(null);
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['agent-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể phản hồi ticket'),
  });

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between align-items-lg-center">
        <div>
          <h2 className="h4 mb-1">Ticket hỗ trợ</h2>
          <p className="mb-0 text-muted">Xử lý các yêu cầu phát sinh từ khách hàng liên quan đến booking do bạn phụ trách.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <select className="form-select" style={{ width: 180 }} value={filters.status} onChange={(e) => setFilters((value) => ({ ...value, status: e.target.value }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="open">Đang mở</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="closed">Đã đóng</option>
          </select>
          <select className="form-select" style={{ width: 180 }} value={filters.priority} onChange={(e) => setFilters((value) => ({ ...value, priority: e.target.value }))}>
            <option value="">Tất cả ưu tiên</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="urgent">Khẩn cấp</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Booking / Tour</th>
              <th>Chủ đề</th>
              <th>Trạng thái</th>
              <th>Ưu tiên</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <div className="fw-semibold">{ticket.customer_name || '--'}</div>
                  <div className="small text-muted">{ticket.booking_id || '--'}</div>
                </td>
                <td>
                  <div className="fw-semibold">{ticket.booking_tour_title || '--'}</div>
                  <div className="small text-muted">{ticket.booking_id || '--'}</div>
                </td>
                <td>{ticket.subject}</td>
                <td>
                  <span className={`badge ${statusClass(ticket.status)}`}>{supportStatusLabel(ticket.status)}</span>
                </td>
                <td>{priorityLabel(ticket.priority)}</td>
                <td>{formatDate(ticket.created_at)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#agentSupportReplyModal"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReply('');
                    }}
                  >
                    Phản hồi
                  </button>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan="7" className="py-4 text-center text-muted">
                  Không có ticket nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="agentSupportReplyModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Phản hồi ticket</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {!selectedTicket ? (
                <div className="text-muted">Chưa chọn ticket.</div>
              ) : (
                <div className="d-grid gap-3">
                  <div className="rounded-4 border p-3 bg-light">
                    <div className="fw-semibold">{selectedTicket.subject}</div>
                    <div className="small text-muted">{selectedTicket.booking_tour_title || '--'}</div>
                    <div className="small text-muted">{selectedTicket.customer_name || '--'}</div>
                    <hr />
                    <div className="small text-muted mb-1">Nội dung khách gửi</div>
                    <div>{selectedTicket.message || '--'}</div>
                    {selectedTicket.reply ? (
                      <>
                        <div className="small text-muted mt-3 mb-1">Phản hồi hiện tại</div>
                        <div className="text-primary">{selectedTicket.reply}</div>
                      </>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-label">Phản hồi</label>
                    <textarea className="form-control" rows="6" value={reply} onChange={(e) => setReply(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                disabled={!selectedTicket || !reply}
                onClick={() => selectedTicket && replyMutation.mutate({ ticketId: selectedTicket.id, payload: { message: reply } })}
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
