import type { Metadata } from "next";
import { generateCategoryMetadata, CategoryLandingPage } from "../offer/[...slug]/CategoryPage";

const SLUG = "weft";

export async function generateMetadata(): Promise<Metadata> {
  return generateCategoryMetadata(SLUG);
}

export default function TresoveVlasyPage() {
  return <CategoryLandingPage slug={SLUG} />;
}
