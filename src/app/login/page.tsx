import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-nude-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="Hairland" className="w-12 h-12 mx-auto mb-4 rounded-xl" />
          <h1 className="text-3xl font-bold text-espresso">Hairland</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
