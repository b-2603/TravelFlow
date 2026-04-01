<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28px 32px; }
        body { font-family: DejaVu Sans, sans-serif; color: #16324f; font-size: 12px; }
        .header {
            background: #0d6efd;
            color: #fff;
            padding: 22px 24px;
            border-radius: 18px;
            margin-bottom: 22px;
        }
        .header-table, .summary-table, .payment-table, .passenger-table { width: 100%; border-collapse: collapse; }
        .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
        .title { font-size: 24px; font-weight: 700; margin: 6px 0 2px; }
        .section {
            border: 1px solid #dbe7f4;
            border-radius: 16px;
            padding: 16px 18px;
            margin-bottom: 18px;
        }
        .section-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
        .label { color: #6b7a90; font-size: 11px; text-transform: uppercase; }
        .value { font-size: 13px; font-weight: 600; }
        .summary-table td { width: 50%; padding: 8px 0; vertical-align: top; }
        .payment-table th, .payment-table td, .passenger-table th, .passenger-table td {
            border-bottom: 1px solid #e9eef5;
            padding: 10px 8px;
            text-align: left;
        }
        .payment-table th, .passenger-table th {
            background: #f5f9ff;
            color: #33506e;
            font-size: 11px;
            text-transform: uppercase;
        }
        .totals {
            margin-top: 16px;
            padding: 14px 16px;
            background: #f7fbff;
            border-radius: 14px;
        }
        .totals-row { margin-bottom: 6px; }
        .totals-row strong { float: right; }
        .status {
            display: inline-block;
            padding: 6px 10px;
            border-radius: 999px;
            background: #e8f1ff;
            color: #0d6efd;
            font-weight: 700;
            font-size: 11px;
        }
        .footer {
            margin-top: 18px;
            font-size: 10px;
            color: #718198;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td>
                    <div class="eyebrow">TravelFlow</div>
                    <div class="title">Hóa đơn / Phiếu xác nhận tour</div>
                    <div>Mã booking: #{{ (string) $booking->_id }}</div>
                </td>
                <td style="text-align: right;">
                    <div class="eyebrow">Ngày xuất</div>
                    <div>{{ $issuedAt->format('d/m/Y H:i') }}</div>
                    <div style="margin-top: 8px;"><span class="status">{{ strtoupper($booking->status) }}</span></div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Thông tin khách hàng và tour</div>
        <table class="summary-table">
            <tr>
                <td>
                    <div class="label">Khách hàng</div>
                    <div class="value">{{ $booking->user->name ?? 'N/A' }}</div>
                </td>
                <td>
                    <div class="label">Email</div>
                    <div class="value">{{ $booking->user->email ?? 'N/A' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="label">Tour</div>
                    <div class="value">{{ $booking->tour->title ?? 'N/A' }}</div>
                </td>
                <td>
                    <div class="label">Điểm đến</div>
                    <div class="value">{{ $booking->tour->destination ?? 'N/A' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="label">Ngày khởi hành</div>
                    <div class="value">{{ optional($booking->departure_date)->format('d/m/Y') }}</div>
                </td>
                <td>
                    <div class="label">Số hành khách</div>
                    <div class="value">{{ $booking->num_pax }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Danh sách hành khách</div>
        <table class="passenger-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Họ tên</th>
                    <th>Ngày sinh</th>
                    <th>CCCD / Hộ chiếu</th>
                </tr>
            </thead>
            <tbody>
                @forelse(($booking->passengers ?? []) as $index => $passenger)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $passenger['name'] ?? '--' }}</td>
                        <td>{{ !empty($passenger['dob']) ? \Carbon\Carbon::parse($passenger['dob'])->format('d/m/Y') : '--' }}</td>
                        <td>{{ $passenger['passport'] ?? '--' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4">Chưa có dữ liệu hành khách.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Thanh toán</div>
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Phương thức</th>
                    <th>Phạm vi</th>
                    <th>Trạng thái</th>
                    <th>Thời điểm</th>
                    <th style="text-align: right;">Số tiền</th>
                </tr>
            </thead>
            <tbody>
                @forelse($paymentLines as $payment)
                    <tr>
                        <td>{{ strtoupper($payment->method) }}</td>
                        <td>{{ $payment->payment_scope === 'deposit' ? 'Đặt cọc' : 'Toàn phần' }}</td>
                        <td>{{ strtoupper($payment->status) }}</td>
                        <td>{{ optional($payment->paid_at ?? $payment->created_at)->format('d/m/Y H:i') }}</td>
                        <td style="text-align: right;">{{ number_format((float) $payment->amount, 0, ',', '.') }} đ</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5">Chưa có giao dịch thanh toán.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">Tổng giá trị booking <strong>{{ number_format((float) $booking->total_price, 0, ',', '.') }} đ</strong></div>
            <div class="totals-row">Đã thanh toán <strong>{{ number_format((float) $paidAmount, 0, ',', '.') }} đ</strong></div>
            <div class="totals-row">Còn lại <strong>{{ number_format((float) $remainingAmount, 0, ',', '.') }} đ</strong></div>
            <div class="totals-row" style="margin-bottom: 0;">Trạng thái thanh toán <strong>{{ strtoupper($booking->payment_status) }}</strong></div>
        </div>
    </div>

    <div class="footer">
        TravelFlow • Phiếu xác nhận được tạo tự động từ hệ thống quản lý du lịch.
    </div>
</body>
</html>
