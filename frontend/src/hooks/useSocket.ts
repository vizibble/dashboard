import { useEffect, useLayoutEffect, useRef } from 'react';

import { io, Socket } from 'socket.io-client';

import { useSensorStore } from '@/pages/home/store/sensor-store';
import { useAuthStore } from '@/store/auth-store';

const BACKEND_URL =
  import.meta.env["VITE_BACKEND_URL"] ?? "http://localhost:3000";

export interface UpdatePayload {
  connectionID: string;
  timestamp: string;
  [field: string]: number | string;
}

interface UseSocketOptions {
  onConnectError?: (err: Error) => void;
}

export function useSocket({ onConnectError }: UseSocketOptions = {}): void {
  const socketRef = useRef<Socket | null>(null);
  const onConnectErrorRef = useRef(onConnectError);
  const selectedDeviceId = useSensorStore((s) => s.selectedDeviceId);
  const applyUpdate = useSensorStore((s) => s.applyUpdate);

  // Track previous device id so we can unsubscribe from the old room
  const prevDeviceIdRef = useRef<string | null>(null);
  const deviceIdRef = useRef(selectedDeviceId);

  useLayoutEffect(() => {
    onConnectErrorRef.current = onConnectError;
    deviceIdRef.current = selectedDeviceId;
  });

  // Re-create socket whenever the access token changes.
  // This is critical: on first load ProtectedRoute does a silent refresh
  // asynchronously, so accessToken starts as null. We must wait until it
  // is populated before opening the socket connection.
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return; // don't connect until authenticated

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      // Re-subscribe to current device on reconnect
      if (deviceIdRef.current) {
        socket.emit("subscribe", deviceIdRef.current);
        prevDeviceIdRef.current = deviceIdRef.current;
      }
    });

    socket.on("update", (data: UpdatePayload) => {
      if (data.connectionID === deviceIdRef.current) {
        applyUpdate(data as Record<string, number | string>);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err: Error) => {
      console.error(`[Socket] Connection error: ${err.message}`);
      if (err.message.includes("AUTH_ERROR")) {
        window.location.href = "/#/login";
      }
      onConnectErrorRef.current?.(err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, applyUpdate]); // re-create socket when token changes (null → value on login, value → null on logout)

  // Re-subscribe when selectedDeviceId changes; unsubscribe from previous room
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    // Leave the old device's room
    if (
      prevDeviceIdRef.current &&
      prevDeviceIdRef.current !== selectedDeviceId
    ) {
      socket.emit("unsubscribe", prevDeviceIdRef.current);
    }

    // Join the new device's room
    if (selectedDeviceId) {
      socket.emit("subscribe", selectedDeviceId);
    }

    prevDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);
}
