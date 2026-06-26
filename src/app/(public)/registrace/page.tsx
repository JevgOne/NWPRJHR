import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Registrace salonu | Hairland",
  description: "Zaregistrujte svůj salon pro velkoobchodní nákup vlasů",
};

export default function RegisterPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RegisterForm />
    </div>
  );
}
