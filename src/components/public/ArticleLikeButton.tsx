"use client";

import { useState, useEffect } from "react";

interface ArticleLikeButtonProps {
  articleSlug: string;
}

export function ArticleLikeButton({ articleSlug }: ArticleLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/article-likes?articleSlug=${encodeURIComponent(articleSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        setLiked(data.liked);
        setCount(data.count);
      })
      .catch(() => {});
  }, [articleSlug]);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/article-likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleSlug }),
    });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        liked
          ? "bg-rose text-white shadow-sm"
          : "bg-nude-50 text-muted hover:bg-nude-100 border border-line"
      } ${loading ? "opacity-50" : ""}`}
    >
      <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
