import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { customerAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function HeartIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7.2-4.35-9.2-8.72C1.28 8.91 3.2 5 7.2 5c2.1 0 3.6 1.15 4.8 2.63C13.2 6.15 14.7 5 16.8 5c4 0 5.92 3.91 4.4 7.28C19.2 16.65 12 21 12 21Z" />
    </svg>
  );
}

export default function FavoriteButton({ tourId, className = '' }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, role } = useAuth();
  const canUseFavorites = role === 'customer';

  const { data: favorites = [] } = useQuery({
    queryKey: ['customer-favorites'],
    queryFn: async () => (await customerAPI.favorites()).data?.data ?? [],
    enabled: isAuthenticated && canUseFavorites,
  });

  const favoriteTourIds = useMemo(() => new Set(favorites.map((item) => item.tour_id || item.tour?.id)), [favorites]);
  const active = favoriteTourIds.has(tourId);

  const mutation = useMutation({
    mutationFn: () => (active ? customerAPI.removeFavorite(tourId) : customerAPI.addFavorite(tourId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-favorites'] });
      toast.success(active ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật danh sách yêu thích');
    },
  });

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Hãy đăng nhập để lưu tour yêu thích');
      return;
    }

    if (!canUseFavorites) {
      toast.info('Chức năng yêu thích dành cho tài khoản khách hàng');
      return;
    }

    mutation.mutate();
  };

  return (
    <button
      type="button"
      className={`tf-heart-btn ${active ? 'is-active' : ''} ${className}`}
      onClick={handleClick}
      aria-label={active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      disabled={mutation.isPending}
      title={canUseFavorites ? (active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích') : 'Chức năng dành cho khách hàng'}
    >
      <HeartIcon active={active && canUseFavorites} />
    </button>
  );
}
