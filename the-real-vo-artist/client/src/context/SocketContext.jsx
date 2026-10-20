import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }
    const url = import.meta.env.VITE_SOCKET_URL || undefined; // undefined = same origin
    const s = io(url, { withCredentials: true });
    s.on('connect_error', (err) => console.warn('[socket]', err.message));
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
