"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AuditEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  detail: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ENTITY_OPTIONS = [
  "Product", "Variant", "Delivery", "Customer", "Salon",
  "Order", "Sale", "Invoice", "Payment", "Complaint",
  "ComplaintTicket", "Return", "B2BSettings", "PriceSettings",
  "LoyaltySettings", "BlogPost", "OperatingCost", "Supplier",
  "Company", "SampleRequest", "Review", "CreditNote", "Stylist",
  "User", "System",
];

const ACTION_OPTIONS = [
  "CREATE", "UPDATE", "DELETE", "ARCHIVE", "UNARCHIVE",
  "APPROVE", "REJECT", "CONFIRM", "CANCEL", "COMPLETE",
  "STATUS_CHANGE", "STOCK_IN", "DEACTIVATE", "SUPPLIER_REFUND",
  "LOGIN", "EXPORT", "DELETE_DATA", "BACKUP",
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
  ARCHIVE: "bg-orange-50 text-orange-700",
  UNARCHIVE: "bg-teal-50 text-teal-700",
  APPROVE: "bg-emerald-50 text-emerald-700",
  REJECT: "bg-red-50 text-red-700",
  CONFIRM: "bg-emerald-50 text-emerald-700",
  CANCEL: "bg-red-50 text-red-700",
  COMPLETE: "bg-emerald-50 text-emerald-700",
  STATUS_CHANGE: "bg-purple-50 text-purple-700",
  STOCK_IN: "bg-cyan-50 text-cyan-700",
  DEACTIVATE: "bg-orange-50 text-orange-700",
  SUPPLIER_REFUND: "bg-amber-50 text-amber-700",
  LOGIN: "bg-slate-50 text-slate-700",
  EXPORT: "bg-indigo-50 text-indigo-700",
  DELETE_DATA: "bg-red-50 text-red-700",
  BACKUP: "bg-slate-50 text-slate-700",
};

export function AuditLogClient() {
  const t = useTranslations("auditLog");
  const tCommon = useTranslations("common");
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (entityFilter) params.set("entity", entityFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (userFilter) params.set("userId", userFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    const res = await fetch(`/api/audit-log?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setPages(data.pages);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, entityFilter, actionFilter, userFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function actionLabel(action: string): string {
    try {
      return t(`actions.${action}` as "actions.CREATE");
    } catch {
      return action;
    }
  }

  function entityLabel(entity: string): string {
    try {
      return t(`entities.${entity}` as "entities.Product");
    } catch {
      return entity;
    }
  }

  function formatDetail(detail: Record<string, unknown>): React.ReactNode {
    return (
      <div className="space-y-1">
        {Object.entries(detail).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="font-medium text-espresso min-w-[80px]">{key}:</span>
            <span className="text-muted break-all">
              {typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-espresso mb-1">
            {t("entity")}
          </label>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t("allEntities")}</option>
            {ENTITY_OPTIONS.map((e) => (
              <option key={e} value={e}>{entityLabel(e)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-espresso mb-1">
            {t("action")}
          </label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t("allActions")}</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{actionLabel(a)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-espresso mb-1">
            {t("from")}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-espresso mb-1">
            {t("to")}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end">
          <span className="text-sm text-muted py-2">
            {t("totalEntries", { count: total })}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : logs.length === 0 ? (
        <p className="text-muted">{t("noLogs")}</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="border border-line/60 rounded-lg bg-white hover:bg-nude-50 transition-colors"
              >
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  {/* Time */}
                  <span className="text-xs text-muted whitespace-nowrap min-w-[120px]">
                    {new Date(log.createdAt).toLocaleString("cs-CZ")}
                  </span>

                  {/* Action badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                    ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-700"
                  }`}>
                    {actionLabel(log.action)}
                  </span>

                  {/* Entity */}
                  <span className="text-sm font-medium text-ink whitespace-nowrap">
                    {entityLabel(log.entity)}
                  </span>

                  {/* Entity ID */}
                  {log.entityId && (
                    <span className="text-xs text-muted font-mono">
                      {log.entityId.slice(0, 8)}
                    </span>
                  )}

                  {/* Quick detail preview */}
                  {log.detail && (
                    <span className="text-xs text-muted truncate flex-1 hidden sm:block">
                      {summarizeDetail(log.detail)}
                    </span>
                  )}

                  {/* User */}
                  <span className="text-xs text-espresso whitespace-nowrap ml-auto">
                    {log.userEmail?.split("@")[0] || "—"}
                  </span>

                  {/* Expand indicator */}
                  <span className={`text-muted text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-line/40 pt-2">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium text-espresso">{t("user")}:</span>
                        <span className="ml-2 text-muted">{log.userEmail || log.userId || "—"}</span>
                      </div>
                      <div>
                        <span className="font-medium text-espresso">IP:</span>
                        <span className="ml-2 text-muted">{log.ipAddress || "—"}</span>
                      </div>
                      {log.entityId && (
                        <div className="col-span-2">
                          <span className="font-medium text-espresso">ID:</span>
                          <span className="ml-2 text-muted font-mono">{log.entityId}</span>
                        </div>
                      )}
                    </div>
                    {log.detail && Object.keys(log.detail).length > 0 && (
                      <div className="mt-2 p-2 bg-nude-50 rounded-lg">
                        {formatDetail(log.detail)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            {tCommon("back")}
          </button>
          <span className="text-sm text-gray-600">
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            {tCommon("next")}
          </button>
        </div>
      )}
    </div>
  );
}

function summarizeDetail(detail: Record<string, unknown>): string {
  const parts: string[] = [];
  if (detail.name) parts.push(String(detail.name));
  if (detail.salonName) parts.push(String(detail.salonName));
  if (detail.orderNumber) parts.push(String(detail.orderNumber));
  if (detail.title) parts.push(String(detail.title));
  if (detail.status) parts.push(`→ ${detail.status}`);
  if (detail.category) parts.push(String(detail.category));
  if (detail.count) parts.push(`${detail.count}×`);
  if (detail.totalGrams) parts.push(`${detail.totalGrams}g`);
  if (parts.length === 0 && detail.changes && typeof detail.changes === "object") {
    const keys = Object.keys(detail.changes as object);
    parts.push(keys.slice(0, 3).join(", "));
  }
  return parts.join(" · ") || "—";
}
