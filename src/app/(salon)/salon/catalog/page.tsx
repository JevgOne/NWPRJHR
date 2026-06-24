import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CatalogClient } from "./CatalogClient";

export default async function CatalogPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <CatalogClient />;
}
