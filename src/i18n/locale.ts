"use server";

import { cookies } from "next/headers";
import { defaultLocale, type Locale } from "./config";

const COOKIE_NAME = "HAIRORA_LOCALE";

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get(COOKIE_NAME)?.value as Locale) || defaultLocale;
}

export async function setUserLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale);
}
