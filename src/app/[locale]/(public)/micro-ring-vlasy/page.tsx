import type { Metadata } from "next";
import { generateCategoryMetadata, CategoryLandingPage } from "../vlasy-k-prodlouzeni/[...slug]/CategoryPage";

const SLUG = "micro-ring";

export async function generateMetadata(): Promise<Metadata> {
  return generateCategoryMetadata(SLUG);
}

export default function MicroRingPage() {
  return <CategoryLandingPage slug={SLUG} standalone />;
}
