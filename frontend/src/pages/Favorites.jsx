import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { customerAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { clearCompareTours, saveCompareTours } from '../utils/compareTours';

export default function Favorites() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);

  const { data: favorites = [], isLoading, isError } = useQuery({
    queryKey: ['customer-favorites'],
    queryFn: async () => (await customerAPI.favorites()).data?.data ?? [],
  });

  const selectableFavorites = useMemo(() => favorites.filter((item) => item?.tour), [favorites]);

  const removeMutation = useMutation({
    mutationFn: (tourId) => customerAPI.removeFavorite(tourId),
    onSuccess: () => {
      toast.success('Đã xóa tour khỏi danh sách yêu thích');
      queryClient.invalidateQueries({ queryKey: ['customer-favorites'] });
    },
    onError: () => toast.error('Không thể xóa tour yêu thích'),
  });

  const toggleSelect = (tourId) => {
    setSelectedCompareIds((current) => (
      current.includes(tourId)
        ? current.filter((id) => id !== tourId)
        : current.length < 3
          ? [...current, tourId]
          : current
    ));
  };

  const compareSelected = () => {
    const selectedTours = selectableFavorites
      .map((item) => item.tour)
      .filter((tour) => selectedCompareIds.includes(tour.id));

    if (selectedTours.length < 2) {
      toast.info('Chọn ít nhất 2 tour để so sánh.');
      return;
    }

    saveCompareTours(selectedTours);
    navigate('/compare-tours');
  };

  const clearSelection = () => {
    setSelectedCompareIds([]);
    clearCompareTours();
  };

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex flex-column gap-2 mb-4 flex-md-row justify-content-between align-items-md-center">
        <div>
          <h1 className="h3 mb-1">Tour yêu thích</h1>
          <p className="mb-0 text-muted">Lưu lại các tour bạn muốn theo dõi để đặt sau.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/tours" className="btn btn-outline-primary">
            Khám phá thêm tour
          </Link>
          <button type="button" className="btn btn-primary" disabled={selectedCompareIds.length < 2} onClick={compareSelected}>
            So sánh {selectedCompareIds.length ? `(${selectedCompareIds.length})` : ''}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={clearSelection}>
            Xóa chọn
          </button>
        </div>
      </div>

      {isLoading && <div className="alert alert-light border">Đang tải danh sách yêu thích...</div>}
      {isError && <div className="alert alert-warning">Không thể tải danh sách tour yêu thích.</div>}

      {!isLoading && !isError && favorites.length === 0 && (
        <div className="rounded-4 border bg-white p-5 text-center shadow-sm">
          <h2 className="h4">Bạn chưa lưu tour nào</h2>
          <p className="mb-0 text-muted">Khi thấy tour phù hợp, hãy bấm lưu yêu thích để quay lại nhanh hơn.</p>
        </div>
      )}

      {!isLoading && !isError && favorites.length > 0 && (
        <div className="row g-4">
          {favorites.map((item) => {
            const tour = item.tour;
            const checked = selectedCompareIds.includes(tour?.id);

            return (
              <div className="col-md-6 col-xl-4" key={item.id}>
                <div className="h-100 overflow-hidden rounded-4 border bg-white shadow-sm">
                  <div className="position-relative">
                    <img
                      src={tour?.images?.[0] || 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80'}
                      alt={tour?.title}
                      className="w-100 object-fit-cover"
                      style={{ height: 220 }}
                    />
                    <button
                      type="button"
                      className={`btn btn-sm position-absolute top-0 end-0 m-2 ${checked ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => toggleSelect(tour?.id)}
                    >
                      {checked ? 'Đang chọn' : 'So sánh'}
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 small text-muted">{tour?.destination} • {tour?.duration_days} ngày</div>
                    <h2 className="h5">{tour?.title}</h2>
                    <div className="mb-3 fw-semibold text-primary">{formatCurrency(tour?.price_per_person)}</div>
                    <div className="d-flex gap-2">
                      <Link to={`/tours/${tour?.slug}`} className="btn btn-primary btn-sm">
                        Xem chi tiết
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(tour?.id)}
                      >
                        Bỏ lưu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
