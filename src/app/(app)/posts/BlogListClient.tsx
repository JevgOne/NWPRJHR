"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Obecné",
  care: "Péče o vlasy",
  guide: "Průvodce",
  trends: "Trendy",
  tips: "Tipy",
  news: "Novinky",
};

export function BlogListClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/blog");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const togglePublish = async (post: BlogPost) => {
    await fetch(`/api/blog/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Opravdu smazat článek?")) return;
    await fetch(`/api/blog/${id}`, { method: "DELETE" });
    fetchPosts();
  };

  if (loading) {
    return <div className="text-muted text-center py-12">Načítám...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Blog</h1>
        <Link href="/posts/new">
          <Button>Nový článek</Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8">
            Zatím žádné články. Začněte prvním článkem.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} padding="sm">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/posts/${post.id}`}
                      className="font-semibold text-ink hover:text-rose truncate"
                    >
                      {post.title}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        post.published
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {post.published ? "Publikováno" : "Koncept"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-nude-100 text-espresso">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-muted truncate">{post.excerpt}</p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    /{post.slug}
                    {post.publishedAt && (
                      <> · {new Date(post.publishedAt).toLocaleDateString("cs")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(post)}
                  >
                    {post.published ? "Skrýt" : "Publikovat"}
                  </Button>
                  <Link href={`/posts/${post.id}`}>
                    <Button variant="secondary" size="sm">
                      Upravit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                  >
                    Smazat
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
