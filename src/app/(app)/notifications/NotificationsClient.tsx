"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

function getNotificationUrl(n: NotificationItem): string | null {
  const d = n.data;
  if (!d) return null;

  switch (n.type) {
    case "NEW_ORDER":
    case "ORDER_CONFIRMED":
    case "ORDER_READY":
    case "ORDER_IN_TRANSIT":
    case "ORDER_REJECTED":
      return d.orderId ? `/orders/${d.orderId}` : "/orders";
    case "NEW_INQUIRY":
      return d.inquiryId ? `/orders?tab=inquiries` : "/orders";
    case "INVOICE_ISSUED":
    case "INVOICE_PAID":
    case "INCOMING_PAYMENT":
    case "PAYMENT_REMINDER":
      return d.invoiceId ? `/invoices/${d.invoiceId}` : "/invoices";
    case "SAMPLE_REQUEST":
      return "/samples";
    case "RETURN_REQUEST":
      return "/returns";
    case "NEW_COMPLAINT":
      return "/complaints";
    case "REGISTRATION":
      return d.salonId ? `/salons/${d.salonId}` : "/registrations";
    case "NEW_REVIEW":
      return "/reviews";
    case "NEW_CONTACT":
      return "/notifications";
    default:
      return null;
  }
}

export function NotificationsClient() {
  const t = useTranslations("notificationsMgmt");
  const tc = useTranslations("common");
  const router = useRouter();
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

  async function handleClick(n: NotificationItem) {
    // Mark as read if unread
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: "PUT" });
    }
    // Navigate to relevant page
    const url = getNotificationUrl(n);
    if (url) {
      router.push(url);
    } else {
      // Just refresh to update read state
      fetchNotifications();
    }
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
                : "bg-nude-100 text-espresso"
            }`}
          >
            {t("unreadOnly")}
          </button>
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-nude-100 text-espresso rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            {t("markAllRead")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">{tc("loading")}</p>
      ) : notifications.length === 0 ? (
        <p className="text-muted">{t("noNotifications")}</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const url = getNotificationUrl(n);
            return (
              <div
                key={n.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:shadow-sm ${
                  n.read
                    ? "bg-white border-line hover:bg-nude-50"
                    : "bg-rose/10 border-rose/30 hover:bg-rose/15"
                }`}
                onClick={() => handleClick(n)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span className="w-2 h-2 bg-rose rounded-full flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm">{n.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-muted whitespace-nowrap">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                    {url && (
                      <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {total > notifications.length && (
            <p className="text-center text-sm text-muted py-2">
              {t("showing")} {notifications.length} / {total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
