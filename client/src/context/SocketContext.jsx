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

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:5000/ws`;

    let ws = null;
    let reconnectTimeout = null;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('⚡ Connected to OrgGraph WebSocket server');
          setIsConnected(true);
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
          console.log('⚡ WebSocket disconnected. Retrying in 4 seconds...');
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 4000);
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
        reconnectTimeout = setTimeout(connect, 4000);
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
