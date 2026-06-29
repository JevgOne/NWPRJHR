"use client";

import { useState, useEffect } from "react";

interface CommentUser {
  id: string;
  name: string | null;
  role: string;
}

interface CommentLike {
  userId: string;
}

interface CommentData {
  id: string;
  articleSlug: string;
  userId: string;
  user: CommentUser;
  parentId: string | null;
  content: string;
  editedAt: string | null;
  createdAt: string;
  likes: CommentLike[];
  replies?: CommentData[];
}

interface CommentSectionProps {
  articleSlug: string;
  locale: string;
}

const t = (locale: string, key: string): string => {
  const translations: Record<string, Record<string, string>> = {
    cs: {
      title: "Diskuze",
      placeholder: "Napište komentář...",
      replyPlaceholder: "Napište odpověď...",
      submit: "Odeslat",
      reply: "Odpovědět",
      edit: "Upravit",
      delete: "Smazat",
      cancel: "Zrušit",
      save: "Uložit",
      edited: "upraveno",
      login: "Pro komentování se přihlaste",
      noComments: "Zatím žádné komentáře. Buďte první!",
      confirmDelete: "Opravdu smazat komentář?",
      admin: "Admin",
    },
    uk: {
      title: "Обговорення",
      placeholder: "Напишіть коментар...",
      replyPlaceholder: "Напишіть відповідь...",
      submit: "Надіслати",
      reply: "Відповісти",
      edit: "Редагувати",
      delete: "Видалити",
      cancel: "Скасувати",
      save: "Зберегти",
      edited: "відредаговано",
      login: "Для коментування увійдіть",
      noComments: "Ще немає коментарів. Будьте першим!",
      confirmDelete: "Дійсно видалити коментар?",
      admin: "Адмін",
    },
    ru: {
      title: "Обсуждение",
      placeholder: "Напишите комментарий...",
      replyPlaceholder: "Напишите ответ...",
      submit: "Отправить",
      reply: "Ответить",
      edit: "Редактировать",
      delete: "Удалить",
      cancel: "Отмена",
      save: "Сохранить",
      edited: "отредактировано",
      login: "Для комментирования войдите",
      noComments: "Пока нет комментариев. Будьте первым!",
      confirmDelete: "Действительно удалить комментарий?",
      admin: "Админ",
    },
  };
  return translations[locale]?.[key] ?? translations.cs[key] ?? key;
};

function timeAgo(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (locale === "cs") {
    if (mins < 1) return "právě teď";
    if (mins < 60) return `před ${mins} min`;
    if (hours < 24) return `před ${hours} hod`;
    if (days < 7) return `před ${days} dny`;
    return d.toLocaleDateString("cs");
  }
  if (locale === "uk") {
    if (mins < 1) return "щойно";
    if (mins < 60) return `${mins} хв тому`;
    if (hours < 24) return `${hours} год тому`;
    if (days < 7) return `${days} дн тому`;
    return d.toLocaleDateString("uk");
  }
  // ru
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} дн назад`;
  return d.toLocaleDateString("ru");
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  locale,
  articleSlug,
  onRefresh,
  depth = 0,
}: {
  comment: CommentData;
  currentUserId: string | null;
  isAdmin: boolean;
  locale: string;
  articleSlug: string;
  onRefresh: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = currentUserId === comment.userId || isAdmin;
  const isAuthorAdmin = comment.user.role === "OWNER" || comment.user.role === "EMPLOYEE";
  const likeCount = comment.likes.length;
  const userLiked = currentUserId ? comment.likes.some((l) => l.userId === currentUserId) : false;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleSlug, content: replyText, parentId: comment.id }),
    });
    if (res.ok) {
      setReplyText("");
      setReplying(false);
      onRefresh();
    }
    setSubmitting(false);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editText }),
    });
    if (res.ok) {
      setEditing(false);
      onRefresh();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm(t(locale, "confirmDelete"))) return;
    await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleLike = async () => {
    if (!currentUserId) return;
    await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
    onRefresh();
  };

  return (
    <div className={`${depth > 0 ? "ml-6 pl-4 border-l-2 border-nude-100" : ""}`}>
      <div className="py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blush-100 to-rose/20 flex items-center justify-center text-xs font-bold text-rose">
            {(comment.user.name ?? "?")[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-ink">
            {comment.user.name ?? "Uživatel"}
          </span>
          {isAuthorAdmin && (
            <span className="px-1.5 py-0.5 bg-rose/10 text-rose text-[10px] font-semibold rounded">
              {t(locale, "admin")}
            </span>
          )}
          <span className="text-xs text-muted">{timeAgo(comment.createdAt, locale)}</span>
          {comment.editedAt && (
            <span className="text-[10px] text-muted italic">({t(locale, "edited")})</span>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="px-3 py-1 bg-rose text-white text-xs font-medium rounded-lg hover:bg-rose-deep transition-colors"
              >
                {t(locale, "save")}
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(comment.content); }}
                className="px-3 py-1 text-xs text-muted hover:text-ink transition-colors"
              >
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted leading-relaxed ml-9 whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* Actions */}
        {!editing && (
          <div className="flex items-center gap-3 mt-2 ml-9">
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-1 text-xs transition-colors ${
                userLiked ? "text-rose" : "text-muted hover:text-rose"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={userLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {currentUserId && depth === 0 && (
              <button
                onClick={() => setReplying(!replying)}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                {t(locale, "reply")}
              </button>
            )}
            {canEdit && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-muted hover:text-ink transition-colors"
                >
                  {t(locale, "edit")}
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                >
                  {t(locale, "delete")}
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply form */}
        {replying && (
          <div className="mt-3 ml-9 space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
              placeholder={t(locale, "replyPlaceholder")}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                disabled={submitting || !replyText.trim()}
                className="px-3 py-1 bg-rose text-white text-xs font-medium rounded-lg hover:bg-rose-deep transition-colors disabled:opacity-50"
              >
                {t(locale, "submit")}
              </button>
              <button
                onClick={() => { setReplying(false); setReplyText(""); }}
                className="px-3 py-1 text-xs text-muted hover:text-ink transition-colors"
              >
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              locale={locale}
              articleSlug={articleSlug}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ articleSlug, locale }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchComments = () => {
    fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});
  };

  useEffect(() => {
    fetchComments();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUserId(data.user.id);
          setIsLoggedIn(true);
          setIsAdmin(data.user.role === "OWNER" || data.user.role === "EMPLOYEE");
        }
      })
      .catch(() => {});
  }, [articleSlug]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleSlug, content: newComment }),
    });
    if (res.ok) {
      setNewComment("");
      fetchComments();
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-10 pt-8 border-t border-line">
      <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {t(locale, "title")}
        {comments.length > 0 && (
          <span className="text-sm font-normal text-muted">({comments.length})</span>
        )}
      </h3>

      {/* New comment form */}
      {isLoggedIn ? (
        <div className="mb-6 space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="block w-full rounded-xl border border-line px-4 py-3 text-sm text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose resize-none"
            placeholder={t(locale, "placeholder")}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors disabled:opacity-50"
            >
              {t(locale, "submit")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-nude-50 rounded-xl text-center">
          <p className="text-sm text-muted">
            {t(locale, "login")}{" "}
            <a href="/login" className="text-rose hover:text-rose-deep font-medium">
              &rarr;
            </a>
          </p>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">{t(locale, "noComments")}</p>
      ) : (
        <div className="divide-y divide-nude-100">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              locale={locale}
              articleSlug={articleSlug}
              onRefresh={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
