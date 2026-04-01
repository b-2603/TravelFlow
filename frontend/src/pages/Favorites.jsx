import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customerAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function Favorites() {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading, isError } = useQuery({
    queryKey: ['customer-favorites'],
    queryFn: async () => (await customerAPI.favorites()).data?.data ?? [],
  });

  const removeMutation = useMutation({
    mutationFn: (tourId) => customerAPI.removeFavorite(tourId),
    onSuccess: () => {
      toast.success('Đã xóa tour khỏi danh sách yêu thích');
      queryClient.invalidateQueries({ queryKey: ['customer-favorites'] });
    },
    onError: () => toast.error('Không thể xóa tour yêu thích'),
  });

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex flex-column gap-2 mb-4 flex-md-row justify-content-between align-items-md-center">
        <div>
          <h1 className="h3 mb-1">Tour yêu thích</h1>
          <p className="mb-0 text-muted">Lưu lại các tour bạn muốn theo dõi để đặt sau.</p>
        </div>
        <Link to="/tours" className="btn btn-outline-primary">
          Khám phá thêm tour
        </Link>
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

            return (
              <div className="col-md-6 col-xl-4" key={item.id}>
                <div className="h-100 overflow-hidden rounded-4 border bg-white shadow-sm">
                  <img
                    src={tour?.images?.[0] || 'https://picsum.photos/seed/favorite/800/600'}
                    alt={tour?.title}
                    className="w-100 object-fit-cover"
                    style={{ height: 220 }}
                  />
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
