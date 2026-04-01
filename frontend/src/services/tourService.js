import { tourAPI } from './api';

const unpackTourList = (response) => response.data?.data ?? { items: [], pagination: null };
const unpackTourDetail = (response) => response.data?.data ?? null;
const unpackReviews = (response) => response.data?.data ?? [];

const tourService = {
  list: async (params) => unpackTourList(await tourAPI.list(params)),
  detail: async (slug) => unpackTourDetail(await tourAPI.detail(slug)),
  reviews: async (id) => unpackReviews(await tourAPI.reviews(id)),
};

export default tourService;
