"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";

const SEGMENT_COUNT = 10;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const SEGMENT_COLORS = [
  "#fce4ec", // 5% — rose light
  "#f5f0eb", // miss — nude
  "#f8bbd0", // 10% — rose medium
  "#ede8e2", // miss — nude darker
  "#e8e0d8", // miss — espresso light
  "#e91e63", // 15% — rose strong
  "#f5f0eb", // miss — nude
  "#ffd700", // 20% — gold
  "#ede8e2", // miss — nude darker
  "#ffb300", // 25% — gold deep
];

const SEGMENT_TEXT_COLORS = [
  "#880e4f",
  "#5d4e37",
  "#880e4f",
  "#5d4e37",
  "#5d4e37",
  "#ffffff",
  "#5d4e37",
  "#5d4037",
  "#5d4e37",
  "#5d4037",
];

type SpinState = "idle" | "spinning" | "result-win" | "result-lose" | "already-played" | "error";

export function SpinWheel({ onClose }: { onClose: () => void }) {
  const t = useTranslations("spinWheel");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SpinState>("idle");
  const [rotation, setRotation] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [emailError, setEmailError] = useState(false);
  const wheelRef = useRef<SVGSVGElement>(null);

  const segmentLabels = [
    t("seg5"), t("segMiss"), t("seg10"), t("segMiss"), t("segMiss"),
    t("seg15"), t("segMiss"), t("seg20"), t("segMiss"), t("seg25"),
  ];

  const handleSpin = async () => {
    if (!email || !email.includes("@")) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setState("spinning");

    try {
      const res = await fetch("/api/public/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 409) {
        setState("already-played");
        localStorage.setItem("spin-played", "1");
        return;
      }
      if (res.status === 429) {
        setState("error");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }

      const data = await res.json();
      const segment = data.segment as number;

      // Calculate target rotation: 5 full spins + land on segment
      // Pointer is at top (0deg), wheel rotates clockwise
      // Segment 0 starts at top, going clockwise
      const targetAngle =
        360 * 5 + (360 - (SEGMENT_ANGLE * segment + SEGMENT_ANGLE / 2));
      setRotation(targetAngle);

      // Wait for animation to finish (4s)
      setTimeout(() => {
        if (data.won) {
          setDiscount(data.discountPercent);
          setState("result-win");
          localStorage.setItem("spin-played", "1");
          // Confetti!
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          setTimeout(
            () =>
              confetti({
                particleCount: 80,
                spread: 100,
                origin: { x: 0.3, y: 0.4 },
              }),
            300
          );
          setTimeout(
            () =>
              confetti({
                particleCount: 80,
                spread: 100,
                origin: { x: 0.7, y: 0.4 },
              }),
            600
          );
        } else {
          setState("result-lose");
          localStorage.setItem("spin-played", "1");
        }
      }, 4200);
    } catch {
      setState("error");
    }
  };

  // Generate SVG wheel segments
  const renderWheel = () => {
    const cx = 150;
    const cy = 150;
    const r = 140;
    const segments = [];

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
      const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;

      // Text position (middle of segment)
      const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const textR = r * 0.65;
      const tx = cx + textR * Math.cos(midAngle);
      const ty = cy + textR * Math.sin(midAngle);
      const textRotation = (i + 0.5) * SEGMENT_ANGLE;

      segments.push(
        <g key={i}>
          <path d={path} fill={SEGMENT_COLORS[i]} stroke="#fff" strokeWidth="2" />
          <text
            x={tx}
            y={ty}
            fill={SEGMENT_TEXT_COLORS[i]}
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${textRotation}, ${tx}, ${ty})`}
          >
            {segmentLabels[i]}
          </text>
        </g>
      );
    }

    return segments;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Pointer (triangle at top) */}
      <div className="relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-rose" />
        </div>

        {/* Wheel */}
        <svg
          ref={wheelRef}
          width="300"
          height="300"
          viewBox="0 0 300 300"
          className="max-w-[280px] sm:max-w-[300px]"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: state === "spinning" ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {renderWheel()}
          {/* Center circle */}
          <circle cx="150" cy="150" r="28" fill="#fff" stroke="#e11d48" strokeWidth="3" />
          <text
            x="150"
            y="150"
            fill="#e11d48"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            SPIN
          </text>
        </svg>
      </div>

      {/* State-dependent content */}
      {state === "idle" && (
        <div className="w-full max-w-xs space-y-3 text-center">
          <h3 className="text-lg font-bold text-ink">{t("title")}</h3>
          <p className="text-sm text-muted">{t("subtitle")}</p>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
            placeholder={t("emailPlaceholder")}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose ${
              emailError ? "border-red-400 ring-1 ring-red-400" : "border-line"
            }`}
          />
          {emailError && (
            <p className="text-xs text-red-500">{t("invalidEmail")}</p>
          )}
          <button
            onClick={handleSpin}
            className="w-full py-3 bg-rose text-white font-semibold rounded-xl hover:bg-rose-deep transition-colors text-sm"
          >
            {t("spinButton")}
          </button>
        </div>
      )}

      {state === "spinning" && (
        <div className="text-center">
          <p className="text-sm font-medium text-muted animate-pulse">{t("spinning")}</p>
        </div>
      )}

      {state === "result-win" && (
        <div className="w-full max-w-xs text-center space-y-3">
          <h3 className="text-lg font-bold text-emerald-600">
            {t("won", { discount })}
          </h3>
          <p className="text-sm text-muted">{t("wonSub")}</p>
          <a
            href="/offer"
            className="inline-flex px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-xl hover:bg-rose-deep transition-colors"
          >
            {t("viewOffer")}
          </a>
        </div>
      )}

      {state === "result-lose" && (
        <div className="w-full max-w-xs text-center space-y-3">
          <h3 className="text-lg font-bold text-ink">{t("lost")}</h3>
          <p className="text-sm text-muted">{t("lostSub")}</p>
          <a
            href="/offer"
            className="inline-flex px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-xl hover:bg-rose-deep transition-colors"
          >
            {t("viewOffer")}
          </a>
        </div>
      )}

      {state === "already-played" && (
        <div className="w-full max-w-xs text-center space-y-3">
          <h3 className="text-lg font-bold text-ink">{t("alreadyPlayed")}</h3>
          <p className="text-sm text-muted">{t("alreadyPlayedSub")}</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-muted hover:text-ink transition-colors"
          >
            {t("close")}
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="w-full max-w-xs text-center space-y-3">
          <h3 className="text-lg font-bold text-ink">{t("tooManyAttempts")}</h3>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-muted hover:text-ink transition-colors"
          >
            {t("close")}
          </button>
        </div>
      )}
    </div>
  );
}
