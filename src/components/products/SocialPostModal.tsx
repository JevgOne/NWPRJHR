"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  generateInstagramPost,
  generateFacebookPost,
} from "@/lib/social-post-generator";

type Platform = "instagram" | "facebook";

interface SocialPostModalProps {
  product: {
    id: string;
    slug?: string | null;
    name: string;
    category: string;
    processingType: string;
    origin?: string | null;
    texture?: string | null;
    variants?: Array<{
      lengthCm: number;
      color: string;
      retailPricePerGram?: number;
      active: boolean;
    }>;
  };
  onClose: () => void;
}

export function SocialPostModal({ product, onClose }: SocialPostModalProps) {
  const t = useTranslations();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [copied, setCopied] = useState(false);

  const text =
    platform === "instagram"
      ? generateInstagramPost(product)
      : generateFacebookPost(product);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="text-lg font-semibold text-ink">
            {t("product.generatePost")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Platform tabs */}
        <div className="flex border-b border-line">
          <button
            type="button"
            onClick={() => setPlatform("instagram")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              platform === "instagram"
                ? "text-rose border-b-2 border-rose"
                : "text-muted hover:text-ink"
            }`}
          >
            Instagram
          </button>
          <button
            type="button"
            onClick={() => setPlatform("facebook")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              platform === "facebook"
                ? "text-rose border-b-2 border-rose"
                : "text-muted hover:text-ink"
            }`}
          >
            Facebook
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap text-sm text-ink bg-nude-50 rounded-lg p-4 border border-line font-sans">
            {text}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button size="sm" onClick={handleCopy}>
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        </div>
      </div>
    </div>
  );
}
