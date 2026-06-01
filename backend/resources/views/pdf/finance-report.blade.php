<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28px 30px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #16324f; }
        .hero {
            background: #103d6b;
            color: #fff;
            border-radius: 18px;
            padding: 20px 24px;
            margin-bottom: 20px;
        }
        .hero h1 { margin: 0 0 8px; font-size: 24px; }
        .grid { width: 100%; border-collapse: separate; border-spacing: 12px; margin: 0 -12px 14px; }
        .card {
            background: #f7fbff;
            border: 1px solid #dce8f5;
            border-radius: 16px;
            padding: 14px 16px;
        }
        .label { font-size: 11px; text-transform: uppercase; color: #69809a; margin-bottom: 6px; }
        .value { font-size: 18px; font-weight: 700; }
        .section-title { font-size: 14px; font-weight: 700; margin: 20px 0 10px; }
        table.report { width: 100%; border-collapse: collapse; }
        table.report th, table.report td {
            border-bottom: 1px solid #e5edf6;
            padding: 10px 8px;
            text-align: left;
        }
        table.report th {
            background: #f5f9ff;
            color: #33506e;
            font-size: 11px;
            text-transform: uppercase;
        }
        .muted { color: #69809a; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>Báo cáo tài chính</h1>
        <div>Kỳ báo cáo: {{ $month }}</div>
        <div>Ngày xuất: {{ $generatedAt->format('d/m/Y H:i') }}</div>
    </div>

    <table class="grid">
        <tr>
            <td width="25%"><div class="card"><div class="label">Doanh thu</div><div class="value">{{ number_format((float) $summary['revenue'], 0, ',', '.') }} đ</div></div></td>
            <td width="25%"><div class="card"><div class="label">Hoàn tiền</div><div class="value">{{ number_format((float) $summary['refund_total'], 0, ',', '.') }} đ</div></div></td>
            <td width="25%"><div class="card"><div class="label">Chi phí đối tác</div><div class="value">{{ number_format((float) $summary['service_cost'], 0, ',', '.') }} đ</div></div></td>
            <td width="25%"><div class="card"><div class="label">Lợi nhuận ước tính</div><div class="value">{{ number_format((float) $summary['profit'], 0, ',', '.') }} đ</div></div></td>
        </tr>
    </table>

    <table class="grid">
        <tr>
            <td width="50%"><div class="card"><div class="label">Số booking trong kỳ</div><div class="value">{{ $summary['bookings_count'] }}</div></div></td>
            <td width="50%"><div class="card"><div class="label">Yêu cầu hoàn tiền</div><div class="value">{{ $summary['refund_requests_count'] }}</div></div></td>
        </tr>
    </table>

    <div class="section-title">Breakdown giao dịch</div>
    <table class="report">
        <thead>
            <tr>
                <th>Nhóm</th>
                <th>Nhãn</th>
                <th>Số lượng</th>
                <th>Số tiền</th>
            </tr>
        </thead>
        <tbody>
            @forelse($paymentMethods as $item)
                <tr>
                    <td>Phương thức</td>
                    <td>{{ strtoupper($item['method']) }}</td>
                    <td>{{ $item['count'] }}</td>
                    <td>{{ number_format((float) $item['amount'], 0, ',', '.') }} đ</td>
                </tr>
            @empty
                <tr><td colspan="4" class="muted">Chưa có dữ liệu phương thức thanh toán.</td></tr>
            @endforelse

            @foreach($paymentStatuses as $item)
                <tr>
                    <td>Thanh toán</td>
                    <td>{{ $item['status'] }}</td>
                    <td>{{ $item['count'] }}</td>
                    <td>{{ number_format((float) $item['amount'], 0, ',', '.') }} đ</td>
                </tr>
            @endforeach

            @foreach($refundStatuses as $item)
                <tr>
                    <td>Hoàn tiền</td>
                    <td>{{ $item['status'] }}</td>
                    <td>{{ $item['count'] }}</td>
                    <td>{{ number_format((float) $item['amount'], 0, ',', '.') }} đ</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="section-title">Xu hướng 6 tháng</div>
    <table class="report">
        <thead>
            <tr>
                <th>Tháng</th>
                <th>Doanh thu</th>
                <th>Hoàn tiền</th>
                <th>Yêu cầu hoàn tiền</th>
            </tr>
        </thead>
        <tbody>
            @forelse($monthlyTrend as $item)
                <tr>
                    <td>{{ $item['label'] }}</td>
                    <td>{{ number_format((float) $item['revenue'], 0, ',', '.') }} đ</td>
                    <td>{{ number_format((float) $item['refunds'], 0, ',', '.') }} đ</td>
                    <td>{{ $item['requests'] }}</td>
                </tr>
            @empty
                <tr><td colspan="4" class="muted">Chưa có dữ liệu xu hướng.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">Công nợ đối tác</div>
    <table class="report">
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
            @forelse($liabilities as $item)
                <tr>
                    <td>{{ $item['company_name'] }}</td>
                    <td>{{ $item['service_type'] }}</td>
                    <td>{{ $item['confirmed_orders'] }}</td>
                    <td>{{ number_format((float) $item['payable_amount'], 0, ',', '.') }} đ</td>
                    <td>{{ number_format((float) $item['paid_amount'], 0, ',', '.') }} đ</td>
                    <td>{{ number_format((float) $item['outstanding_amount'], 0, ',', '.') }} đ</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6">Chưa có dữ liệu công nợ đối tác.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
