import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRoleLabel, getWorkspacePath, isInternalRole } from '../utils/workspace';

function NavItem({ to, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-link tf-nav-link ${isActive ? 'active' : ''}`}>
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, role, user } = useAuth();
  const workspacePath = getWorkspacePath(role);
  const showWorkspaceLink = isAuthenticated && isInternalRole(role);
  const isCustomerView = !isAuthenticated || role === 'customer';
  const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0a5c86&color=fff`;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg tf-public-navbar sticky-top">
      <div className="container py-2">
        <Link className="navbar-brand d-flex align-items-center gap-3 fw-bold tf-navbar-brand" to="/">
          <span className="tf-brand-mark">T</span>
          <span className="tf-navbar-brand-copy">
            TravelFlow
            <span className="d-block small fw-normal text-muted">Du lịch sống động và quản lý mượt mà</span>
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Mở điều hướng"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav mx-auto mb-3 mb-lg-0 gap-lg-2">
            <li className="nav-item">
              <NavItem to="/">Trang chủ</NavItem>
            </li>
            <li className="nav-item">
              <NavItem to="/tours">Khám phá tour</NavItem>
            </li>
            {isAuthenticated && role === 'customer' && (
              <li className="nav-item">
                <NavItem to="/favorites">Yêu thích</NavItem>
              </li>
            )}
            {showWorkspaceLink && (
              <li className="nav-item">
                <NavItem to={workspacePath}>Khu vực làm việc</NavItem>
              </li>
            )}
          </ul>

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 tf-navbar-actions">
            {isAuthenticated ? (
              <>
                {isCustomerView ? (
                  <Link to="/my-bookings" className="btn btn-outline-dark rounded-pill px-3">
                    Đơn của tôi
                  </Link>
                ) : (
                  <Link to={workspacePath} className="btn btn-outline-dark rounded-pill px-3">
                    Công việc của tôi
                  </Link>
                )}

                <div className="dropdown">
                  <button
                    className="tf-user-chip dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="tf-user-avatar">
                      <img src={avatar} alt={user?.name || 'Tài khoản'} />
                      <span className="tf-user-online" />
                    </span>
                    <span className="tf-user-meta">
                      <strong>{user?.name || 'Tài khoản'}</strong>
                      <span>{getRoleLabel(role)}</span>
                    </span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-2">
                    <li className="px-3 py-2">
                      <div className="fw-semibold">{user?.name}</div>
                      <div className="small text-muted">{getRoleLabel(role)}</div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link className="dropdown-item rounded-3" to="/profile">
                        Hồ sơ cá nhân
                      </Link>
                    </li>
                    {role === 'customer' && (
                      <>
                        <li>
                          <Link className="dropdown-item rounded-3" to="/my-support">
                            Hỗ trợ của tôi
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded-3" to="/favorites">
                            Danh sách yêu thích
                          </Link>
                        </li>
                      </>
                    )}
                    {showWorkspaceLink && (
                      <li>
                        <Link className="dropdown-item rounded-3" to={workspacePath}>
                          Về khu vực làm việc
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button type="button" className="dropdown-item rounded-3 text-danger" onClick={handleLogout}>
                        Đăng xuất
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-dark rounded-pill px-3">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary rounded-pill px-3">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
