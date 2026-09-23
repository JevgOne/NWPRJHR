import type { Metadata } from "next";
import { generateCategoryMetadata, CategoryLandingPage } from "../vlasy-k-prodlouzeni/[...slug]/CategoryPage";

const SLUG = "tape-in";

export async function generateMetadata(): Promise<Metadata> {
  return generateCategoryMetadata(SLUG);
}

export default function TapeInPage() {
  return <CategoryLandingPage slug={SLUG} standalone />;
}
