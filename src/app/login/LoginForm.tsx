"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("invalidCredentials"));
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink mb-4">{t("login")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label={t("email")}
          required
          autoComplete="email"
        />
        <Input
          id="password"
          name="password"
          type="password"
          label={t("password")}
          required
          autoComplete="current-password"
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : t("loginButton")}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/registrace" className="text-rose font-medium hover:underline">
          {t("registerSalon")}
        </Link>
      </div>
      <div className="mt-3 flex justify-center">
        <LocaleSwitcher />
      </div>
    </Card>
  );
}
