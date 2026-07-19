import type { Metadata } from "next";
import { generateCategoryMetadata, CategoryLandingPage } from "../offer/[...slug]/CategoryPage";

const SLUG = "ofiny";

export async function generateMetadata(): Promise<Metadata> {
  return generateCategoryMetadata(SLUG);
}

export default function OfinyPage() {
  return <CategoryLandingPage slug={SLUG} standalone />;
}
