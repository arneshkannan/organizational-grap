import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const listenersRef = useRef(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let wsUrl = import.meta.env.VITE_WS_URL;

    if (!wsUrl) {
      if (isLocal) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
      } else if (import.meta.env.VITE_API_BASE_URL) {
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        const wsProto = apiBase.startsWith('https') ? 'wss:' : 'ws:';
        const cleanHost = apiBase.replace(/^https?:\/\//, '').replace(/\/$/, '');
        wsUrl = `${wsProto}//${cleanHost}/ws`;
      }
    }

    let ws = null;
    let reconnectTimeout = null;
    let retries = 0;
    const maxRetries = isLocal ? 20 : 3;

    function connect() {
      if (!wsUrl) {
        console.log('ℹ️ WebSocket URL not configured for production; running in standalone mode.');
        setIsConnected(false);
        return;
      }

      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('⚡ Connected to OrgGraph WebSocket server');
          setIsConnected(true);
          retries = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'REPORT_PROCESSED') {
              const newNotif = {
                id: Date.now() + Math.random(),
                type: 'REPORT_PROCESSED',
                title: 'New Progress Report Uploaded',
                message: `${data.payload.authorName} (${data.payload.departmentName} - ${data.payload.teamName}) submitted an update for "${data.payload.projectName}"`,
                details: data.payload,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false,
              };

              setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
            } else if (data.type === 'PROJECT_CREATED') {
              const newNotif = {
                id: Date.now() + Math.random(),
                type: 'PROJECT_CREATED',
                title: 'New Project Assigned',
                message: `Project "${data.payload.name}" was newly created.`,
                details: data.payload,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false,
              };
              setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
            } else if (data.type === 'PROJECT_DELETED') {
              const newNotif = {
                id: Date.now() + Math.random(),
                type: 'PROJECT_DELETED',
                title: 'Project Removed',
                message: `Project "${data.payload.name || 'Untitled'}" was deleted by Manager.`,
                details: data.payload,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false,
              };
              setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
            }

            // Notify all registered listeners
            listenersRef.current.forEach(listener => {
              try {
                listener(data);
              } catch (err) {
                console.error('Error in socket listener:', err);
              }
            });
          } catch (e) {
            console.error('WebSocket parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (retries < maxRetries) {
            retries++;
            reconnectTimeout = setTimeout(connect, 4000);
          } else {
            console.log('⚡ WebSocket server currently unavailable. Running in standard HTTP mode.');
          }
        };

        ws.onerror = (err) => {
          ws.close();
        };
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
        if (retries < maxRetries) {
          retries++;
          reconnectTimeout = setTimeout(connect, 4000);
        }
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [user]);

  const addListener = (callback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        notifications,
        addListener,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
