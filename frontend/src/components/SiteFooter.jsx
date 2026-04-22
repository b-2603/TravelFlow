import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getWorkspacePath, isInternalRole } from '../utils/workspace';

export default function SiteFooter() {
  const { isAuthenticated, role } = useAuth();
  const isCustomer = role === 'customer';
  const workspacePath = getWorkspacePath(role);

  return (
    <footer className="tf-footer mt-auto pt-5 pb-4">
      <div className="container">
        <div className="row g-4 align-items-start tf-footer-grid">
          <div className="col-lg-4 tf-footer-col">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="tf-brand-mark">T</div>
              <div>
                <div className="fw-bold fs-5">TravelFlow</div>
                <div className="small text-white-50">Nền tảng quản lý và đặt tour du lịch</div>
              </div>
            </div>
            <p className="mb-0 text-white-50">
              Kết nối khách hàng, điều hành tour, hướng dẫn viên, đối tác và kế toán trong một trải nghiệm trực quan hơn.
            </p>
          </div>

          <div className="col-sm-6 col-lg-2 tf-footer-col">
            <h6 className="text-uppercase small fw-bold mb-3">Khám phá</h6>
            <div className="d-grid gap-2 small">
              <Link className="tf-footer-link" to="/">Trang chủ</Link>
              <Link className="tf-footer-link" to="/tours">Danh sách tour</Link>
              {isCustomer && <Link className="tf-footer-link" to="/favorites">Yêu thích</Link>}
              {isAuthenticated && isInternalRole(role) && <Link className="tf-footer-link" to={workspacePath}>Khu vực làm việc</Link>}
            </div>
          </div>

          <div className="col-sm-6 col-lg-3 tf-footer-col">
            <h6 className="text-uppercase small fw-bold mb-3">Hỗ trợ khách hàng</h6>
            <div className="d-grid gap-2 small">
              {isCustomer ? (
                <>
                  <Link className="tf-footer-link" to="/my-bookings">Đơn đặt tour của tôi</Link>
                  <Link className="tf-footer-link" to="/my-support">Trung tâm hỗ trợ</Link>
                </>
              ) : (
                <>
                  <Link className="tf-footer-link" to="/tours">Khám phá tour công khai</Link>
                  <span className="text-white-50">Mọi actor đều xem được trang chủ, tour và chi tiết tour.</span>
                </>
              )}
              <Link className="tf-footer-link" to="/profile">Hồ sơ cá nhân</Link>
            </div>
          </div>

          <div className="col-lg-3 tf-footer-col">
            <h6 className="text-uppercase small fw-bold mb-3">Liên hệ</h6>
            <div className="small text-white-50 d-grid gap-2">
              <span>Hotline: 1900 6868</span>
              <span>Email: hello@travelflow.local</span>
              <span>Văn phòng: 54 Tô Ngọc Vân, Thạnh Xuân, Quận 12, TpHCM</span>
            </div>
          </div>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between gap-2 pt-4 mt-4 border-top border-light border-opacity-10 small text-white-50">
          <span>© 2026 TravelFlow. All rights reserved.</span>
          <span>Thiết kế cho trải nghiệm du lịch sống động, mượt và giàu cảm xúc.</span>
        </div>
      </div>
    </footer>
  );
}
