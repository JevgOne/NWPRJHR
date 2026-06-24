import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateProductForm } from "./CreateProductForm";

export default async function NewProductPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/products");

  return (
    <div className="max-w-2xl">
      <CreateProductForm />
    </div>
  );
}
