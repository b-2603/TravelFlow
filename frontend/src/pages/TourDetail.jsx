import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import FavoriteButton from '../components/FavoriteButton';
import { customerAPI, reviewAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTourDetail, useTourReviews } from '../hooks/useTours';
import { formatCurrency, formatDate } from '../utils/formatters';

const reviewSchema = Yup.object({
  title: Yup.string().min(6, 'Vui lòng nhập tiêu đề chi tiết hơn').max(160).required('Vui lòng nhập tiêu đề bài đánh giá'),
  rating: Yup.number().min(1).max(5).required(),
  comment: Yup.string().min(20, 'Vui lòng nhập ít nhất 20 ký tự').required('Vui lòng nhập nội dung bài đánh giá'),
});

function averageRating(reviews) {
  if (!reviews.length) {
    return 0;
  }

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return total / reviews.length;
}

function ratingBreakdown(reviews) {
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => Number(review.rating) === star).length;
    const percent = reviews.length ? (count / reviews.length) * 100 : 0;

    return { star, count, percent };
  });
}

export default function TourDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [selectedDeparture, setSelectedDeparture] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [reviewImages, setReviewImages] = useState([]);

  const { data: tour, isLoading, isError } = useTourDetail(slug);
  const { data: reviews = [], refetch: refetchReviews } = useTourReviews(tour?.id);

  const { data: favorites = [] } = useQuery({
    queryKey: ['customer-favorites', tour?.id],
    queryFn: async () => (await customerAPI.favorites()).data?.data ?? [],
    enabled: Boolean(isAuthenticated && user?.role === 'customer' && tour?.id),
  });

  const departures = tour?.departures || [];
  const chosenDeparture = departures.find((item) => item.date === selectedDeparture) || departures[0];
  const totalPrice = (chosenDeparture?.price_override || tour?.price_per_person || 0) * travelers;
  const avgRating = averageRating(reviews);
  const breakdown = ratingBreakdown(reviews);
  const myReview = useMemo(
    () => reviews.find((review) => review.user_id === user?.id || review.user?.id === user?.id),
    [reviews, user?.id]
  );

  const reviewMutation = useMutation({
    mutationFn: (payload) => reviewAPI.create(payload),
    onSuccess: async () => {
      toast.success('Đã đăng điểm xếp hạng và bài viết đánh giá.');
      setReviewImages([]);
      await refetchReviews();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể gửi bài đánh giá.');
    },
  });

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="alert alert-light border">Đang tải chi tiết tour...</div>
      </div>
    );
  }

  if (isError || !tour) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Không thể tải chi tiết tour này.</div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      <div className="row g-4">
        <div className="col-lg-8">
          <div id="tourGallery" className="carousel slide mb-4 overflow-hidden rounded-4 shadow-sm" data-bs-ride="carousel">
            <div className="carousel-indicators">
              {(tour.images?.length ? tour.images : [null]).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  data-bs-target="#tourGallery"
                  data-bs-slide-to={index}
                  className={index === 0 ? 'active' : ''}
                  aria-current={index === 0 ? 'true' : 'false'}
                ></button>
              ))}
            </div>
            <div className="carousel-inner">
              {(tour.images?.length ? tour.images : ['https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80']).map((image, index) => (
                <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                  <img src={image} alt={tour.title} className="d-block w-100" style={{ height: 440, objectFit: 'cover' }} loading={index === 0 ? 'eager' : 'lazy'} />
                </div>
              ))}
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#tourGallery" data-bs-slide="prev">
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Trước</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#tourGallery" data-bs-slide="next">
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Sau</span>
            </button>
          </div>

          <div className="mb-3 d-flex flex-wrap gap-2">
            <span className="badge bg-light text-dark">{tour.destination}</span>
            <span className="badge bg-light text-dark">{tour.category}</span>
            <span className="badge bg-light text-dark">{tour.duration_days} ngày</span>
          </div>

          <div className="mb-3 d-flex flex-wrap justify-content-between gap-3">
            <div>
              <h1 className="display-6 fw-semibold">{tour.title}</h1>
              <p className="text-muted mb-0">{tour.description}</p>
            </div>
            {user?.role === 'customer' && (
              <div className="d-flex align-items-start">
                <FavoriteButton tourId={tour.id} />
              </div>
            )}
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button type="button" className={`nav-link ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
                Tổng quan
              </button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${tab === 'itinerary' ? 'active' : ''}`} onClick={() => setTab('itinerary')}>
                Lịch trình
              </button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
                Điểm xếp hạng và bài viết đánh giá
              </button>
            </li>
          </ul>

          {tab === 'overview' && (
            <div className="rounded-4 border bg-white p-4 shadow-sm">
              <h2 className="h4 mb-3">Điểm nổi bật</h2>
              <div className="row g-3">
                {(tour.highlights || []).map((item) => (
                  <div className="col-md-6" key={item}>
                    <div className="h-100 rounded-3 border p-3">{item}</div>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Thông tin điểm đến</h2>
                  <div className="rounded-3 border p-3 bg-light">
                    {tour.destination_overview || 'Chưa có thông tin.'}
                  </div>
                </div>
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Lịch sử / bối cảnh</h2>
                  <div className="rounded-3 border p-3 bg-light">
                    {tour.historical_background || 'Chưa có thông tin.'}
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Văn hóa địa phương</h2>
                  <div className="d-grid gap-2">
                    {(tour.local_culture || []).map((item) => (
                      <div key={item} className="rounded-3 border p-3">
                        {item}
                      </div>
                    ))}
                    {(tour.local_culture || []).length === 0 && <div className="text-muted">Chưa có thông tin.</div>}
                  </div>
                </div>
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Thời điểm đẹp nhất để đi</h2>
                  <div className="rounded-3 border p-3 bg-light">
                    {tour.best_time_to_visit || 'Chưa có thông tin.'}
                  </div>
                  <div className="mt-3">
                    <h3 className="h6 mb-2">Ghi chú thời tiết</h3>
                    <div className="rounded-3 border p-3">
                      {tour.weather_notes || 'Chưa có thông tin.'}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Dịch vụ bao gồm</h2>
                  <div className="d-grid gap-2">
                    {(tour.included_services || []).map((item) => (
                      <div key={item} className="rounded-3 border p-3">
                        {item}
                      </div>
                    ))}
                    {(tour.included_services || []).length === 0 && <div className="text-muted">Chưa có thông tin.</div>}
                  </div>
                </div>
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Dịch vụ không bao gồm</h2>
                  <div className="d-grid gap-2">
                    {(tour.excluded_services || []).map((item) => (
                      <div key={item} className="rounded-3 border p-3">
                        {item}
                      </div>
                    ))}
                    {(tour.excluded_services || []).length === 0 && <div className="text-muted">Chưa có thông tin.</div>}
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Phù hợp với</h2>
                  <div className="d-flex flex-wrap gap-2">
                    {(tour.suitable_for || []).map((item) => (
                      <span key={item} className="badge bg-light text-dark border">{item}</span>
                    ))}
                    {(tour.suitable_for || []).length === 0 && <div className="text-muted">Chưa có thông tin.</div>}
                  </div>
                </div>
                <div className="col-lg-6">
                  <h2 className="h5 mb-3">Điểm tập trung</h2>
                  <div className="rounded-3 border p-3">
                    {tour.meeting_point || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              <h2 className="h5 mb-3">Điều kiện tham gia</h2>
              <div className="d-grid gap-2">
                {(tour.participation_conditions || []).map((item) => (
                  <div key={item} className="rounded-3 border p-3">
                    {item}
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              <h2 className="h5 mb-3">Lưu ý khi đi tour</h2>
              <div className="d-grid gap-2">
                {(tour.travel_tips || []).map((item) => (
                  <div key={item} className="rounded-3 border p-3">
                    {item}
                  </div>
                ))}
                {(tour.travel_tips || []).length === 0 && <div className="text-muted">Chưa có thông tin.</div>}
              </div>
            </div>
          )}

          {tab === 'itinerary' && (
            <div className="rounded-4 border bg-white p-4 shadow-sm">
              {(tour.itinerary || []).map((item) => (
                <div key={`${item.day}-${item.title}`} className="mb-3 border-start border-4 border-primary ps-3">
                  <div className="small text-uppercase text-muted">Ngày {item.day}</div>
                  <h3 className="h5 mb-1">{item.title}</h3>
                  <p className="mb-0 text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'reviews' && (
            <div id="reviews" className="rounded-4 border bg-white p-4 shadow-sm">
              <div className="mb-4">
                <div className="small fw-semibold text-primary text-uppercase mb-2">Viết bài đánh giá</div>
                <h2 className="h3 mb-2">Điểm xếp hạng và bài viết đánh giá</h2>
                <p className="text-muted mb-0">
                  Mọi tài khoản đã đăng nhập đều có thể chia sẻ cảm nhận, chấm điểm và đính kèm hình ảnh thực tế cho tour này.
                </p>
              </div>

              <div className="row g-4 align-items-start mb-4">
                <div className="col-lg-4">
                  <div className="rounded-4 bg-light p-4 h-100">
                    <div className="display-3 fw-semibold">{avgRating.toFixed(1)}</div>
                    <div className="text-warning fs-4 mb-2">{'★'.repeat(Math.round(avgRating || 0))}{'☆'.repeat(5 - Math.round(avgRating || 0))}</div>
                    <div className="text-muted">{reviews.length} bài đánh giá</div>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="rounded-4 border p-4">
                    {breakdown.map((item) => (
                      <div key={item.star} className="d-flex align-items-center gap-3 mb-3">
                        <div style={{ width: 24 }}>{item.star}</div>
                        <div className="progress flex-grow-1" role="progressbar" aria-valuenow={item.percent} aria-valuemin="0" aria-valuemax="100" style={{ height: 10 }}>
                          <div className="progress-bar" style={{ width: `${item.percent}%` }} />
                        </div>
                        <div className="small text-muted" style={{ width: 48 }}>
                          {item.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!isAuthenticated ? (
                <Link to="/login" className="btn btn-outline-primary mb-4">
                  Đăng nhập để viết bài đánh giá
                </Link>
              ) : myReview ? (
                <div className="alert alert-light border mb-4">
                  Bạn đã gửi bài đánh giá cho tour này rồi. Hệ thống hiện chỉ cho phép mỗi tài khoản một bài đánh giá cho mỗi tour.
                </div>
              ) : (
                <Formik
                  initialValues={{ title: '', rating: 5, comment: '' }}
                  validationSchema={reviewSchema}
                  onSubmit={(values, helpers) => {
                    const formData = new FormData();
                    formData.append('tour_id', tour.id);
                    formData.append('title', values.title);
                    formData.append('rating', values.rating);
                    formData.append('comment', values.comment);
                    reviewImages.forEach((file) => {
                      formData.append('image_files[]', file);
                    });

                    reviewMutation.mutate(formData, {
                      onSuccess: () => {
                        helpers.resetForm();
                      },
                    });
                  }}
                >
                  <Form className="rounded-4 border p-4 mb-4">
                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label">Tiêu đề bài đánh giá</label>
                        <Field name="title" className="form-control" placeholder="Ví dụ: Tour đẹp, lịch trình hợp lý và hướng dẫn viên nhiệt tình" />
                        <div className="mt-1 small text-danger">
                          <ErrorMessage name="title" />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Điểm xếp hạng</label>
                        <Field as="select" name="rating" className="form-select">
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value} sao
                            </option>
                          ))}
                        </Field>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Bài viết đánh giá</label>
                        <Field as="textarea" rows="5" name="comment" className="form-control" placeholder="Chia sẻ trải nghiệm thực tế, lịch trình, chất lượng dịch vụ, điểm bạn thích hoặc chưa hài lòng..." />
                        <div className="mt-1 small text-danger">
                          <ErrorMessage name="comment" />
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Hình ảnh đánh giá</label>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          multiple
                          className="form-control"
                          onChange={(event) => setReviewImages(Array.from(event.currentTarget.files || []))}
                        />
                        <div className="form-text">Bạn có thể đính kèm nhiều ảnh thực tế. Mỗi ảnh tối đa 5MB.</div>
                        {reviewImages.length ? (
                          <div className="mt-2 d-flex flex-wrap gap-2">
                            {reviewImages.map((file, index) => (
                              <span key={`${file.name}-${index}`} className="badge text-bg-light border">
                                {file.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary" disabled={reviewMutation.isPending}>
                          {reviewMutation.isPending ? 'Đang gửi...' : 'Đăng bài đánh giá'}
                        </button>
                      </div>
                    </div>
                  </Form>
                </Formik>
              )}

              {reviews.length === 0 ? (
                <div className="alert alert-light border mb-0">Chưa có bài đánh giá nào cho tour này.</div>
              ) : (
                <div className="d-grid gap-3">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-4 border p-4">
                      <div className="d-flex justify-content-between gap-3 flex-wrap">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={review.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'User')}&background=0a5c86&color=fff`}
                            alt={review.user?.name || 'Tài khoản'}
                            className="rounded-circle object-fit-cover"
                            width="52"
                            height="52"
                          />
                          <div>
                            <div className="fw-semibold">{review.user?.name || 'Thành viên'}</div>
                            <div className="small text-muted">{formatDate(review.created_at)}</div>
                          </div>
                        </div>
                        <div className="text-warning fw-semibold">{'★'.repeat(Number(review.rating || 0))}{'☆'.repeat(5 - Number(review.rating || 0))}</div>
                      </div>

                      <h3 className="h5 mt-3 mb-2">{review.title}</h3>
                      <p className="mb-0 text-muted">{review.comment}</p>

                      {review.images?.length ? (
                        <div className="mt-3 d-flex flex-wrap gap-2">
                          {review.images.map((image, index) => (
                            <a key={`${review.id}-${index}`} href={image} target="_blank" rel="noreferrer">
                              <img
                                src={image}
                                alt={`${review.title} ${index + 1}`}
                                className="rounded-3 border"
                                style={{ width: 96, height: 96, objectFit: 'cover' }}
                                loading="lazy"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="sticky-top rounded-4 border bg-white p-4 shadow-sm tf-responsive-sticky" style={{ top: '96px' }}>
            <div className="small text-uppercase text-muted mb-2">Giá mỗi khách</div>
            <div className="display-6 mb-3 fw-semibold text-primary">
              {formatCurrency(chosenDeparture?.price_override || tour.price_per_person)}
            </div>

            <div className="mb-3">
              <label className="form-label">Ngày khởi hành</label>
              <select className="form-select" value={selectedDeparture} onChange={(e) => setSelectedDeparture(e.target.value)}>
                {departures.map((item) => (
                  <option key={item.date} value={item.date}>
                    {formatDate(item.date)} | {item.available_slots} chỗ
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Số khách</label>
              <input
                type="number"
                min="1"
                max={chosenDeparture?.available_slots || 10}
                className="form-control"
                value={travelers}
                onChange={(e) => setTravelers(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            <div className="mb-3 rounded-3 bg-light p-3">
              <div className="d-flex justify-content-between">
                <span>Tổng tiền</span>
                <strong>{formatCurrency(totalPrice)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() =>
                navigate('/booking', {
                  state: {
                    tour,
                    departureDate: chosenDeparture?.date,
                    numPax: travelers,
                  },
                })
              }
            >
              Đặt ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
