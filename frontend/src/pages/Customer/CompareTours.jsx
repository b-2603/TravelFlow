import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearCompareTours, getCompareTours, saveCompareTours } from '../../utils/compareTours';
import { formatCurrency, formatDate } from '../../utils/formatters';

const fields = [
  { label: 'Tên tour', key: 'title' },
  { label: 'Điểm đến', key: 'destination' },
  { label: 'Danh mục', key: 'category' },
  { label: 'Số ngày', key: 'duration_days' },
  { label: 'Số khách tối đa', key: 'max_pax' },
  { label: 'Giá gốc', key: 'price_per_person', format: formatCurrency },
  { label: 'Giá hiệu lực', key: 'effective_price', format: formatCurrency },
  { label: 'Trạng thái', key: 'status' },
  { label: 'Cập nhật', key: 'updated_at', format: formatDate },
];

export default function CompareTours() {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    const sync = () => setTours(getCompareTours());
    sync();

    window.addEventListener('compare:tours-updated', sync);
    return () => window.removeEventListener('compare:tours-updated', sync);
  }, []);

  const canCompare = tours.length >= 2;

  const sortedTours = useMemo(() => tours.slice(0, 3), [tours]);

  const removeTour = (tourId) => {
    const next = tours.filter((tour) => tour.id !== tourId);
    saveCompareTours(next);
    setTours(next);
  };

  const reset = () => {
    clearCompareTours();
    setTours([]);
  };

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
        <div>
          <h1 className="h3 mb-1">So sánh tour</h1>
          <p className="mb-0 text-muted">So sánh nhanh những tour bạn đã chọn từ danh sách yêu thích.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/favorites" className="btn btn-outline-primary">Quay lại yêu thích</Link>
          <button type="button" className="btn btn-outline-secondary" onClick={reset}>
            Xóa tất cả
          </button>
        </div>
      </div>

      {!canCompare ? (
        <div className="rounded-4 border bg-white p-5 text-center shadow-sm">
          <h2 className="h4 mb-2">Chọn ít nhất 2 tour để so sánh</h2>
          <p className="mb-0 text-muted">Vào trang yêu thích và chọn các tour bạn muốn đặt lên bàn cân.</p>
        </div>
      ) : (
        <div className="rounded-4 border bg-white shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 220 }}>Tiêu chí</th>
                  {sortedTours.map((tour) => (
                    <th key={tour.id} style={{ minWidth: 260 }}>
                      <div className="d-flex justify-content-between gap-2 align-items-start">
                        <div>
                          <div className="fw-semibold">{tour.title}</div>
                          <div className="small text-muted">{tour.destination}</div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeTour(tour.id)}>
                          Bỏ
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.key}>
                    <th className="table-light">{field.label}</th>
                    {sortedTours.map((tour) => {
                      const rawValue = tour[field.key];
                      const value = field.format ? field.format(rawValue) : rawValue || '--';

                      return (
                        <td key={`${tour.id}-${field.key}`}>{value}</td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th className="table-light">Hình ảnh</th>
                  {sortedTours.map((tour) => (
                    <td key={`${tour.id}-image`}>
                      <img
                        src={tour.images?.[0] || 'https://picsum.photos/seed/compare/800/500'}
                        alt={tour.title}
                        className="rounded-3 border w-100 object-fit-cover"
                        style={{ height: 160 }}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="table-light">Hành động</th>
                  {sortedTours.map((tour) => (
                    <td key={`${tour.id}-action`}>
                      <div className="d-flex flex-wrap gap-2">
                        <Link to={`/tours/${tour.slug}`} className="btn btn-primary btn-sm">Xem chi tiết</Link>
                        <Link to={`/tours/${tour.slug}`} className="btn btn-outline-primary btn-sm">Xem tour</Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
