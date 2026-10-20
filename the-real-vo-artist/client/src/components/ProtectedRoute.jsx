import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner full />;

  if (!user) {
    const to = roles?.length === 1 && roles[0] === 'ARTIST' ? '/artist/auth' : roles?.length === 1 ? '/client/auth' : '/';
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'ARTIST' ? '/artist/profile/edit' : '/feed'} replace />;
  }

  return children ?? <Outlet />;
}
