import { useQuery } from '@tanstack/react-query';
import tourService from '../services/tourService';

export function useTours(params = {}) {
  return useQuery({
    queryKey: ['tours', params],
    queryFn: () => tourService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useTourDetail(slug) {
  return useQuery({
    queryKey: ['tour-detail', slug],
    queryFn: () => tourService.detail(slug),
    enabled: Boolean(slug),
  });
}

export function useTourReviews(tourId) {
  return useQuery({
    queryKey: ['tour-reviews', tourId],
    queryFn: () => tourService.reviews(tourId),
    enabled: Boolean(tourId),
  });
}
