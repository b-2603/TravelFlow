<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class FinanceReportExportController extends Controller
{
    public function __construct(
        private readonly PaymentController $paymentController
    ) {
    }

    public function export(Request $request)
    {
        $month = $request->string('month', Carbon::now()->format('Y-m'))->toString();
        $format = $request->string('format', 'csv')->lower()->toString();

        if (! in_array($format, ['csv', 'pdf'], true)) {
            return $this->apiResponse(false, null, 'Định dạng xuất báo cáo không hợp lệ.', 422);
        }

        $reportPayload = $this->paymentController->financeReport($request)->getData(true);
        $liabilitiesPayload = $this->paymentController->partnerLiabilities()->getData(true);

        $reportData = $reportPayload['data'] ?? [];
        $liabilitiesData = $liabilitiesPayload['data'] ?? [];

        $filename = 'bao-cao-tai-chinh-'.$month.'.'.$format;

        if ($format === 'pdf') {
            try {
                $pdfWorkDir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'travelflow-dompdf';
                $pdfFontDir = $pdfWorkDir.DIRECTORY_SEPARATOR.'fonts';
                File::ensureDirectoryExists($pdfFontDir);

                $pdfTempFile = tempnam($pdfWorkDir, 'finance-report-');
                if ($pdfTempFile === false) {
                    throw new \RuntimeException('Không thể tạo file tạm cho PDF.');
                }

                $pdf = Pdf::loadView('pdf.finance-report', [
                    'month' => $reportData['month'] ?? $month,
                    'summary' => $reportData['summary'] ?? [],
                    'paymentMethods' => $reportData['breakdown']['payment_methods'] ?? [],
                    'paymentStatuses' => $reportData['breakdown']['payment_statuses'] ?? [],
                    'refundStatuses' => $reportData['breakdown']['refund_statuses'] ?? [],
                    'monthlyTrend' => $reportData['monthly_trend'] ?? [],
                    'liabilities' => $liabilitiesData['items'] ?? [],
                    'generatedAt' => Carbon::now(),
                ])->setPaper('a4')->setOptions([
                    'defaultFont' => 'DejaVu Sans',
                    'fontDir' => $pdfFontDir,
                    'fontCache' => $pdfFontDir,
                    'tempDir' => $pdfWorkDir,
                    'chroot' => base_path(),
                    'isRemoteEnabled' => false,
                    'isHtml5ParserEnabled' => true,
                    'isFontSubsettingEnabled' => true,
                    'dpi' => 96,
                ]);

                $pdfPath = $pdfTempFile.'.pdf';
                @unlink($pdfTempFile);
                $pdf->save($pdfPath);

                return response()->download($pdfPath, $filename, [
                    'Content-Type' => 'application/pdf',
                ])->deleteFileAfterSend(true);
            } catch (\Throwable $exception) {
                Log::error('Failed to generate finance report PDF.', [
                    'exception' => $exception,
                    'month' => $month,
                ]);

                return $this->apiResponse(false, null, 'Lỗi khi tạo file PDF. Vui lòng thử lại sau.', 500);
            }
        }

        $rows = [
            ['Bao cao tai chinh', $month],
            ['Ngay xuat', Carbon::now()->format('d/m/Y H:i')],
            [],
            ['Chi so', 'Gia tri'],
            ['Doanh thu', $reportData['summary']['revenue'] ?? 0],
            ['Hoan tien', $reportData['summary']['refund_total'] ?? 0],
            ['Chi phi doi tac', $reportData['summary']['service_cost'] ?? 0],
            ['Loi nhuan uoc tinh', $reportData['summary']['profit'] ?? 0],
            ['So booking', $reportData['summary']['bookings_count'] ?? 0],
            ['So yeu cau hoan tien', $reportData['summary']['refund_requests_count'] ?? 0],
            [],
            ['Phuong thuc thanh toan'],
            ['Phuong thuc', 'So giao dich', 'So tien'],
        ];

        foreach ($reportData['breakdown']['payment_methods'] ?? [] as $item) {
            $rows[] = [$item['method'] ?? '', $item['count'] ?? 0, $item['amount'] ?? 0];
        }

        $rows[] = [];
        $rows[] = ['Trang thai thanh toan'];
        $rows[] = ['Trang thai', 'So giao dich', 'So tien'];

        foreach ($reportData['breakdown']['payment_statuses'] ?? [] as $item) {
            $rows[] = [$item['status'] ?? '', $item['count'] ?? 0, $item['amount'] ?? 0];
        }

        $rows[] = [];
        $rows[] = ['Trang thai hoan tien'];
        $rows[] = ['Trang thai', 'So yeu cau', 'So tien'];

        foreach ($reportData['breakdown']['refund_statuses'] ?? [] as $item) {
            $rows[] = [$item['status'] ?? '', $item['count'] ?? 0, $item['amount'] ?? 0];
        }

        $rows[] = [];
        $rows[] = ['Xu huong 6 thang'];
        $rows[] = ['Thang', 'Doanh thu', 'Hoan tien', 'Yeu cau hoan tien'];

        foreach ($reportData['monthly_trend'] ?? [] as $item) {
            $rows[] = [$item['label'] ?? '', $item['revenue'] ?? 0, $item['refunds'] ?? 0, $item['requests'] ?? 0];
        }

        $rows[] = [];
        $rows[] = ['Cong no doi tac'];
        $rows[] = ['Cong ty', 'Loai dich vu', 'Don da xac nhan', 'Phai tra', 'Da tra', 'Con no'];

        foreach ($liabilitiesData['items'] ?? [] as $item) {
            $rows[] = [
                $item['company_name'] ?? '',
                $item['service_type'] ?? '',
                $item['confirmed_orders'] ?? 0,
                $item['payable_amount'] ?? 0,
                $item['paid_amount'] ?? 0,
                $item['outstanding_amount'] ?? 0,
            ];
        }

        return response()->streamDownload(function () use ($rows) {
            $stream = fopen('php://output', 'w');
            echo "\xEF\xBB\xBF";

            foreach ($rows as $row) {
                fputcsv($stream, $row);
            }

            fclose($stream);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
