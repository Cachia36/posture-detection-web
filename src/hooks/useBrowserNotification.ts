"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationPermissionState = NotificationPermission | "unsupported";

export function useBrowserNotification() {
    const [permission, setPermission] =
        useState<NotificationPermissionState>("default");

    useEffect(() => {
        if (!("Notification" in window)) {
            setPermission("unsupported");
            return;
        }

        setPermission(Notification.permission);
    }, []);

    const requestPermission = useCallback(async () => {
        if (!("Notification" in window)) {
            setPermission("unsupported");
            return "unsupported";
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    }, []);

    const showNotification = useCallback(
        (title: string, body: string) => {
            if (!("Notification" in window)) return;

            if (Notification.permission !== "granted") return;

            new Notification(title, {
                body,
                icon: "/favicon.ico",
            });
        },
        [],
    );

    return {
        permission,
        requestPermission,
        showNotification,
    };
}