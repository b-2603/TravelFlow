import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getWorkspacePath, isInternalRole } from '../utils/workspace';

export default function Unauthorized() {
  const { role } = useAuth();
  const fallbackPath = isInternalRole(role) ? getWorkspacePath(role) : '/';

  return (
    <div className="container py-5">
      <div className="bg-white border rounded-5 p-5 text-center shadow-sm">
        <div className="small text-uppercase fw-bold text-primary mb-2">Truy cập bị chặn</div>
        <h1 className="display-6 fw-bold mb-3">Bạn không có quyền vào trang này</h1>
        <p className="text-muted mb-4">
          Tài khoản hiện tại không được cấp quyền cho màn hình bạn vừa mở. Hãy quay về khu vực phù hợp để tiếp tục làm việc.
        </p>
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
          <Link to={fallbackPath} className="btn btn-primary rounded-pill px-4">
            {isInternalRole(role) ? 'Về khu vực làm việc' : 'Về trang chủ'}
          </Link>
          <Link to="/" className="btn btn-outline-dark rounded-pill px-4">
            Mở trang công khai
          </Link>
        </div>
      </div>
    </div>
  );
}
