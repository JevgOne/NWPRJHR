import type { Metadata } from "next";
import { generateCategoryMetadata, CategoryLandingPage } from "../vlasy-k-prodlouzeni/[...slug]/CategoryPage";

const SLUG = "clip-in";

export async function generateMetadata(): Promise<Metadata> {
  return generateCategoryMetadata(SLUG);
}

export default function ClipInPage() {
  return <CategoryLandingPage slug={SLUG} standalone />;
}
