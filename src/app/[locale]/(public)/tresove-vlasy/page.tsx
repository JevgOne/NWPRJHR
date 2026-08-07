import type { Metadata } from "next";
import { generateCategoryMetadata, CategoryLandingPage } from "../vlasy-k-prodlouzeni/[...slug]/CategoryPage";

const SLUG = "weft";

export async function generateMetadata(): Promise<Metadata> {
  return generateCategoryMetadata(SLUG);
}

export default function TresoveVlasyPage() {
  return <CategoryLandingPage slug={SLUG} standalone />;
}
