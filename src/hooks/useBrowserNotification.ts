"use client";

import { useCallback, useMemo, useState } from "react";

type NotificationPermissionState = NotificationPermission | "unsupported";

function getInitialPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export function useBrowserNotification() {
  const [permission, setPermission] = useState<NotificationPermissionState>(getInitialPermission);

  const isSupported = useMemo(() => permission !== "unsupported", [permission]);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    new Notification(title, {
      body,
      icon: "/favicon.ico",
    });
  }, []);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}
