import type { Metadata } from "next";
import { generateCategoryMetadata, CategoryLandingPage } from "../offer/[...slug]/CategoryPage";

const SLUG = "micro-ring";

export async function generateMetadata(): Promise<Metadata> {
  return generateCategoryMetadata(SLUG);
}

export default function MicroRingPage() {
  return <CategoryLandingPage slug={SLUG} />;
}
