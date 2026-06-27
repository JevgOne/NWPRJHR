"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export function NotificationsClient() {
  const t = useTranslations("notificationsMgmt");
  const tc = useTranslations("common");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnread, setShowUnread] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const params = showUnread ? "?unread=true&limit=50" : "?limit=50";
    const res = await fetch(`/api/notifications${params}`);
    if (res.ok) {
      const json = await res.json();
      setNotifications(json.data);
      setTotal(json.total);
    }
    setLoading(false);
  }, [showUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PUT" });
    fetchNotifications();
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read-all" }),
    });
    fetchNotifications();
  }

  function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("justNow");
    if (diffMin < 60) return `${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUnread(!showUnread)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              showUnread
                ? "bg-rose text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {t("unreadOnly")}
          </button>
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            {t("markAllRead")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">{tc("loading")}</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">{t("noNotifications")}</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                n.read
                  ? "bg-white border-gray-200"
                  : "bg-rose/10 border-rose/30"
              }`}
              onClick={() => !n.read && handleMarkRead(n.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 bg-rose rounded-full" />
                    )}
                    <span className="font-medium text-sm">{n.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {total > notifications.length && (
            <p className="text-center text-sm text-gray-500 py-2">
              {t("showing")} {notifications.length} / {total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
