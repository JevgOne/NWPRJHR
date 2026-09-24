"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  salonName: string | null;
  message: string;
  customerPhotos: string | null;
  locale: string;
  assignedTo: string | null;
  repliedAt: string | null;
  repliedBy: string | null;
  createdAt: string;
}

const LOCALE_LABELS: Record<string, string> = {
  cs: "CZ",
  uk: "UA",
  ru: "RU",
};

export function MessagesClient() {
  const t = useTranslations("contactMessages");
  const tc = useTranslations("common");

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter === "UNREPLIED") params.set("filter", "unreplied");
    if (filter === "REPLIED") params.set("filter", "replied");
    const q = params.toString() ? `?${params}` : "";
    const res = await fetch(`/api/contact-messages${q}`);
    if (res.ok) {
      setMessages(await res.json());
    }
    setLoading(false);
  }, [search, filter]);

  async function toggleReplied(id: string, currentlyReplied: boolean) {
    setTogglingId(id);
    const res = await fetch(`/api/contact-messages/${id}/replied`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replied: !currentlyReplied }),
    });
    if (res.ok) {
      fetchMessages();
    }
    setTogglingId(null);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMessages();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchMessages, search]);

  function parsePhotos(photosJson: string | null): string[] {
    if (!photosJson) return [];
    try {
      const parsed = JSON.parse(photosJson);
      if (typeof parsed === "string") return JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <span className="text-sm text-muted">
          {messages.length} {t("total")}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 max-w-md border border-line rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose/30"
        />
        <div className="flex gap-2">
          {(["ALL", "UNREPLIED", "REPLIED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                filter === f
                  ? "bg-rose text-white"
                  : "bg-nude-100 text-espresso hover:bg-gray-200"
              }`}
            >
              {f === "ALL" ? t("filterAll") : f === "UNREPLIED" ? t("filterUnreplied") : t("filterReplied")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted">{tc("loading")}</p>
      ) : messages.length === 0 ? (
        <p className="text-muted">{t("noMessages")}</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const photos = parsePhotos(msg.customerPhotos);

            return (
              <div
                key={msg.id}
                className="bg-white border border-line rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-nude-50 transition-colors"
                >
                  <span className="text-sm font-medium text-ink flex-1 truncate">
                    {msg.name}
                  </span>
                  <span className="text-xs text-muted hidden sm:inline truncate max-w-[200px]">
                    {msg.email}
                  </span>
                  {msg.salonName && (
                    <span className="text-xs text-muted hidden md:inline truncate max-w-[150px]">
                      {msg.salonName}
                    </span>
                  )}
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-nude-100 text-espresso">
                    {LOCALE_LABELS[msg.locale] ?? msg.locale}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      msg.repliedAt
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {msg.repliedAt ? t("replied") : t("unreplied")}
                  </span>
                  {photos.length > 0 && (
                    <span className="text-xs text-muted">
                      📎 {photos.length}
                    </span>
                  )}
                  <span className="text-xs text-muted whitespace-nowrap">
                    {formatDate(msg.createdAt)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-muted transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-line">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Detail label={t("name")} value={msg.name} />
                        <Detail
                          label={t("email")}
                          value={msg.email}
                          href={`mailto:${msg.email}`}
                        />
                        <Detail
                          label={t("phone")}
                          value={msg.phone ?? "—"}
                          href={msg.phone ? `tel:${msg.phone}` : undefined}
                        />
                      </div>
                      <div className="space-y-2">
                        {msg.salonName && (
                          <Detail label={t("salon")} value={msg.salonName} />
                        )}
                        <Detail
                          label={t("language")}
                          value={LOCALE_LABELS[msg.locale] ?? msg.locale}
                        />
                        <Detail label={t("date")} value={formatDate(msg.createdAt)} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted uppercase mb-1">
                        {t("messageContent")}
                      </p>
                      <p className="text-sm text-ink whitespace-pre-wrap bg-nude-50 rounded-lg p-3">
                        {msg.message}
                      </p>
                    </div>

                    {photos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted uppercase mb-2">
                          {t("photos")}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {photos.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={`/api/photo?url=${encodeURIComponent(url)}`}
                                alt={`${t("photos")} ${i + 1}`}
                                className="w-24 h-24 object-cover rounded border border-line"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-line flex items-center gap-2">
                      <a
                        href={`mailto:${msg.email}`}
                        className="px-4 py-2 bg-rose text-white text-sm rounded-lg hover:bg-rose-deep"
                      >
                        {t("reply")}
                      </a>
                      {msg.phone && (
                        <a
                          href={`tel:${msg.phone}`}
                          className="px-4 py-2 bg-nude-100 text-espresso text-sm rounded-lg hover:bg-gray-200"
                        >
                          {t("call")}
                        </a>
                      )}
                      <button
                        onClick={() => toggleReplied(msg.id, !!msg.repliedAt)}
                        disabled={togglingId === msg.id}
                        className={`px-4 py-2 text-sm rounded-lg disabled:opacity-50 ${
                          msg.repliedAt
                            ? "border border-gray-300 text-muted hover:bg-gray-100"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {msg.repliedAt ? t("markAsUnreplied") : t("markAsReplied")}
                      </button>
                      {msg.repliedAt && msg.repliedBy && (
                        <span className="text-xs text-muted ml-auto">
                          {t("repliedByOn", {
                            name: msg.repliedBy,
                            date: formatDate(msg.repliedAt),
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted uppercase">{label}</p>
      {href ? (
        <a href={href} className="text-sm text-rose hover:underline">
          {value}
        </a>
      ) : (
        <p className="text-sm text-ink">{value}</p>
      )}
    </div>
  );
}
