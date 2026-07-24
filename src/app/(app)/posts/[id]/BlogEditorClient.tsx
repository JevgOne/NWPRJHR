"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BlogEditorProps {
  postId?: string;
}

// CATEGORIES moved inside component to access translations

const LANGS = [
  { code: "cs", flag: "🇨🇿", label: "Čeština" },
  { code: "uk", flag: "🇺🇦", label: "Українська" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BlogEditorClient({ postId }: BlogEditorProps) {
  const router = useRouter();
  const t = useTranslations("blog");
  const tc = useTranslations("common");
  const isNew = !postId;
  const [lang, setLang] = useState<LangCode>("cs");

  const CATEGORIES = [
    { value: "general", label: t("categoryGeneral") },
    { value: "care", label: t("categoryCare") },
    { value: "guide", label: t("categoryGuide") },
    { value: "trends", label: t("categoryTrends") },
    { value: "tips", label: t("categoryTips") },
    { value: "news", label: t("categoryNews") },
  ];

  const [title, setTitle] = useState("");
  const [titleUk, setTitleUk] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [excerptUk, setExcerptUk] = useState("");
  const [excerptRu, setExcerptRu] = useState("");
  const [content, setContent] = useState("");
  const [contentUk, setContentUk] = useState("");
  const [contentRu, setContentRu] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("general");
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [socialPost, setSocialPost] = useState("");
  const [socialCopied, setSocialCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/blog/${postId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((post) => {
        setTitle(post.title);
        setTitleUk(post.titleUk ?? "");
        setTitleRu(post.titleRu ?? "");
        setSlug(post.slug);
        setSlugManual(true);
        setExcerpt(post.excerpt ?? "");
        setExcerptUk(post.excerptUk ?? "");
        setExcerptRu(post.excerptRu ?? "");
        setContent(post.content ?? "");
        setContentUk(post.contentUk ?? "");
        setContentRu(post.contentRu ?? "");
        setCoverImage(post.coverImage ?? "");
        setMetaTitle(post.metaTitle ?? "");
        setMetaDescription(post.metaDescription ?? "");
        setSocialPost(post.socialPost ?? "");
        setCategory(post.category);
        setPublished(post.published);
        setPublishedAt(
          post.publishedAt
            ? new Date(post.publishedAt).toISOString().split("T")[0]
            : ""
        );
        setLoading(false);
      })
      .catch(() => {
        setError(t("articleNotFound"));
        setLoading(false);
      });
  }, [postId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload selhal (${res.status})`);
      }
      const data = await res.json();
      const url = data.photoUrls?.[0] ?? data.urls?.[0];
      if (!url) throw new Error("Server nevrátil URL obrázku");
      setCoverImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nahrávání obrázku selhalo");
    } finally {
      setUploading(false);
    }
  };

  // Get/set by current lang
  const currentTitle = lang === "uk" ? titleUk : lang === "ru" ? titleRu : title;
  const setCurrentTitle = (v: string) => {
    if (lang === "uk") setTitleUk(v);
    else if (lang === "ru") setTitleRu(v);
    else handleTitleChange(v);
  };
  const currentExcerpt = lang === "uk" ? excerptUk : lang === "ru" ? excerptRu : excerpt;
  const setCurrentExcerpt = (v: string) => {
    if (lang === "uk") setExcerptUk(v);
    else if (lang === "ru") setExcerptRu(v);
    else setExcerpt(v);
  };
  const currentContent = lang === "uk" ? contentUk : lang === "ru" ? contentRu : content;
  const setCurrentContent = (v: string) => {
    if (lang === "uk") setContentUk(v);
    else if (lang === "ru") setContentRu(v);
    else setContent(v);
  };

  const save = async (pub?: boolean) => {
    setSaving(true);
    setError("");

    const shouldPublish = pub !== undefined ? pub : published;
    const payload = {
      title,
      titleUk: titleUk || undefined,
      titleRu: titleRu || undefined,
      slug,
      excerpt: excerpt || undefined,
      excerptUk: excerptUk || undefined,
      excerptRu: excerptRu || undefined,
      content,
      contentUk: contentUk || undefined,
      contentRu: contentRu || undefined,
      coverImage: coverImage || undefined,
      category,
      published: shouldPublish,
      publishedAt: publishedAt || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      ogImage: undefined,
      socialPost: socialPost || undefined,
    };

    const url = isNew ? "/api/blog" : `/api/blog/${postId}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/posts");
      router.refresh();
    } else {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : t("saveError")
      );
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-muted text-center py-12">{tc("loading")}</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {isNew ? t("newArticle") : t("editArticle")}
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/posts")}>
            {tc("back")}
          </Button>
          <Button variant="secondary" onClick={() => save(false)} disabled={saving}>
            {t("saveDraft")}
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {saving ? tc("saving") : published ? tc("save") : t("publish")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Language tabs */}
      <div className="flex gap-1 mb-4">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              lang === l.code
                ? "bg-rose text-white"
                : "bg-nude-50 text-muted hover:bg-nude-100"
            }`}
          >
            <span>{l.flag}</span>
            {l.label}
            {l.code !== "cs" && (
              <span className={`w-1.5 h-1.5 rounded-full ${
                (l.code === "uk" ? titleUk : titleRu) ? "bg-green-400" : "bg-gray-300"
              }`} />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Input
              label={lang === "cs" ? t("titleCs") : lang === "uk" ? t("titleUk") : t("titleRu")}
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder={lang === "cs" ? "Jak správně pečovat o prodloužené vlasy" : lang === "uk" ? "Як правильно доглядати за нарощеним волоссям" : "Как правильно ухаживать за наращенными волосами"}
            />

            {lang === "cs" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    label={t("slugLabel")}
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManual(true);
                    }}
                    placeholder="jak-pecovat-o-vlasy"
                  />
                  <p className="text-xs text-muted mt-1">
                    /blog/{slug || "..."}
                  </p>
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-espresso mb-1">
                    {t("categoryLabel")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-lg border border-line px-3 py-2 text-ink sm:text-sm focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-48">
                  <Input
                    label={t("publishDate")}
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {lang === "cs" && (
          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  {t("coverImage")}
                </label>
                <div className="flex items-center gap-4">
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-32 h-20 object-cover rounded-lg border border-line"
                    />
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-nude-50 border border-line rounded-lg text-sm font-medium text-espresso hover:bg-nude-100 transition-colors">
                    {uploading ? t("uploading") : coverImage ? t("changeCover") : t("uploadImage")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                  {coverImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverImage("")}
                    >
                      {t("removeCover")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {lang === "cs" ? t("excerptLabel") : lang === "uk" ? t("excerptUk") : t("excerptRu")}
            </label>
            <textarea
              value={currentExcerpt}
              onChange={(e) => setCurrentExcerpt(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
              placeholder={lang === "cs" ? t("excerptPlaceholder") : ""}
            />
          </div>
        </Card>

        {lang === "cs" && (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-semibold text-espresso">{t("seoTitle")}</span>
              </div>
              <Input
                label={t("metaTitleLabel")}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || t("metaTitlePlaceholder")}
              />
              <p className="text-xs text-muted -mt-3">
                {t("charsCount", { count: metaTitle.length })} {metaTitle.length > 60 && t("charsTooLong")}
              </p>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  {t("metaDescLabel")}
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
                  placeholder={excerpt || t("metaDescPlaceholder")}
                />
                <p className="text-xs text-muted mt-1">
                  {t("metaDescCount", { count: metaDescription.length })} {metaDescription.length > 155 && t("charsTooLong")}
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">{t("ogAutoTitle")}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {coverImage ? t("ogAutoDescWithCover") : t("ogAutoDescNoCover")}
                  </p>
                </div>
                {coverImage && (
                  <img src={coverImage} alt="OG preview" className="w-24 h-14 object-cover rounded border border-green-200 ml-auto" />
                )}
              </div>
              {/* Preview */}
              {(metaTitle || metaDescription) && (
                <div className="mt-2 p-3 bg-nude-50 rounded-lg border border-line">
                  <p className="text-xs text-muted mb-1.5 font-medium">{t("searchPreview")}</p>
                  <p className="text-sm text-blue-700 font-medium truncate">
                    {metaTitle || title || t("articleTitle")} | Hairland
                  </p>
                  <p className="text-xs text-green-700 truncate">www.hairland.cz/blog/{slug}</p>
                  <p className="text-xs text-muted line-clamp-2 mt-0.5">
                    {metaDescription || excerpt || t("articleDesc")}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {lang === "cs" && (
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📱</span>
                <span className="text-sm font-semibold text-espresso">{t("socialTitle")}</span>
              </div>
              <p className="text-xs text-muted">
                {t("socialDesc")}
              </p>
              <textarea
                value={socialPost}
                onChange={(e) => setSocialPost(e.target.value)}
                rows={8}
                className="block w-full rounded-lg border border-line px-3 py-2 text-ink text-sm placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
                placeholder={t("socialPlaceholder")}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!title) return;
                    const hashtags = "#vlasy #prodlouzenivlasu #hairextensions #praha #hairland";
                    const cta = "\n\n👉 Celý článek na blogu — odkaz v bio";
                    const ex = excerpt || "";

                    const templates = [
                      `💇‍♀️ ${title}\n\n${ex}\n\nTohle by měla vědět každá holka, která přemýšlí o prodloužení. Celý článek jsme sepsali na blogu — žádný bullshit, jen konkrétní info.${cta}\n\n${hashtags}`,
                      `Holky, tohle si přečtěte 👇\n\n${title.toUpperCase()}\n\n${ex}\n\nVšechno, co potřebujete vědět, na jednom místě.${cta}\n\n${hashtags}`,
                      `✨ Nový článek na blogu!\n\n${title}\n\n${ex}\n\nJestli řešíte prodloužení vlasů, tohle vám ušetří spoustu času a peněz.${cta}\n\n${hashtags}`,
                    ];
                    const pick = templates[Math.floor(Math.random() * templates.length)];
                    setSocialPost(pick);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-rose text-white rounded-lg hover:bg-rose/90 transition-colors"
                >
                  {t("generate")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(socialPost);
                    setSocialCopied(true);
                    setTimeout(() => setSocialCopied(false), 2000);
                  }}
                  disabled={!socialPost}
                  className="px-3 py-1.5 text-xs font-medium bg-nude-100 text-espresso rounded-lg hover:bg-nude-200 transition-colors disabled:opacity-40"
                >
                  {socialCopied ? tc("copied") : tc("copy")}
                </button>
                <span className="text-xs text-muted ml-auto">
                  {t("socialChars", { count: socialPost.length })}
                </span>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {lang === "cs" ? t("contentLabel") : lang === "uk" ? t("contentUk") : t("contentRu")}
            </label>
            <p className="text-xs text-muted mb-2">
              {t("markdownHint")}
            </p>
            <textarea
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              rows={20}
              className="block w-full rounded-lg border border-line px-3 py-2 text-ink font-mono text-sm placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
              placeholder={lang === "cs" ? t("contentPlaceholder") : ""}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
