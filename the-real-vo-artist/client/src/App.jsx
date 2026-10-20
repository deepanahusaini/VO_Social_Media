import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import ArtistAuth from './pages/ArtistAuth.jsx';
import ClientAuth from './pages/ClientAuth.jsx';
import ProfileEditor from './pages/ProfileEditor.jsx';
import ArtistProfile from './pages/ArtistProfile.jsx';
import AudioFeed from './pages/AudioFeed.jsx';
import Messages from './pages/Messages.jsx';

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404</h1>
      <Link to="/" className="btn-primary">Go home</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Phase 1 */}
        <Route path="/" element={<Landing />} />
        <Route path="/artist/auth" element={<ArtistAuth />} />
        <Route path="/client/auth" element={<ClientAuth />} />

        {/* Phase 2 */}
        <Route path="/artists/:id" element={<ArtistProfile />} />
        <Route element={<ProtectedRoute roles={['ARTIST']} />}>
          <Route path="/artist/profile/edit" element={<ProfileEditor />} />
        </Route>

        {/* Phase 3 */}
        <Route element={<ProtectedRoute roles={['CLIENT']} />}>
          <Route path="/feed" element={<AudioFeed />} />
        </Route>

        {/* Phase 4 */}
        <Route element={<ProtectedRoute roles={['ARTIST', 'CLIENT']} />}>
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
