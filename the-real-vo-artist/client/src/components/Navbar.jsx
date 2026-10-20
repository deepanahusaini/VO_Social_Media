import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-bold tracking-tight">
          🎙️ The Real <span className="text-violet-400">VO</span> Artist
        </Link>
        <div className="flex items-center gap-1">
          {!user && (
            <>
              <NavLink to="/artist/auth" className={linkCls}>For Artists</NavLink>
              <NavLink to="/client/auth" className={linkCls}>For Clients</NavLink>
            </>
          )}
          {user?.role === 'ARTIST' && (
            <>
              <NavLink to="/artist/profile/edit" className={linkCls}>Edit Profile</NavLink>
              {user.artistProfile && (
                <NavLink to={`/artists/${user.artistProfile.id}`} className={linkCls}>View Public</NavLink>
              )}
            </>
          )}
          {user?.role === 'CLIENT' && <NavLink to="/feed" className={linkCls}>Feed</NavLink>}
          {user && <NavLink to="/messages" className={linkCls}>Messages</NavLink>}
          {user && (
            <button onClick={handleLogout} className="ml-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-red-300">
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
