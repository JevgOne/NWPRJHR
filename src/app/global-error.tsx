"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="cs">
      <body style={{ margin: 0, padding: "40px 20px", background: "#fdfaf7", fontFamily: "system-ui, sans-serif", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ maxWidth: 440, background: "#fff", borderRadius: 12, padding: 32, boxShadow: "0 2px 8px rgba(58,44,42,.08)", textAlign: "center" }}>
          <h1 style={{ fontSize: 20, color: "#3a2c2a", margin: "0 0 12px" }}>Něco se pokazilo</h1>
          <p style={{ color: "#9c8682", fontSize: 14, lineHeight: 1.6 }}>Omlouváme se, došlo k neočekávané chybě.</p>
          <button
            onClick={() => reset()}
            style={{ marginTop: 20, padding: "10px 24px", background: "#a96d6c", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
          >
            Zkusit znovu
          </button>
        </div>
      </body>
    </html>
  );
}
