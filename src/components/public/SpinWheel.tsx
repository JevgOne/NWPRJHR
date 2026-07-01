"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";

const SEGMENT_COUNT = 10;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

// Premium brand palette — alternating warm tones
const SEGMENT_COLORS = [
  "#c98b88", // 5%  — rose
  "#f7efe8", // miss — nude-100
  "#dba8a6", // 10% — blush-300
  "#efe0d6", // miss — nude-200
  "#f6e3e0", // miss — blush-100
  "#a96d6c", // 15% — rose-deep
  "#f7efe8", // miss — nude-100
  "#c2a36b", // 20% — gold
  "#efe0d6", // miss — nude-200
  "#7d5a5c", // 25% — mauve
];

const SEGMENT_TEXT_COLORS = [
  "#ffffff", // on rose
  "#3a2c2a", // on nude
  "#3a2c2a", // on blush
  "#3a2c2a", // on nude
  "#3a2c2a", // on blush
  "#ffffff", // on rose-deep
  "#3a2c2a", // on nude
  "#3a2c2a", // on gold
  "#3a2c2a", // on nude
  "#ffffff", // on mauve
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

      const targetAngle =
        360 * 5 + (360 - (SEGMENT_ANGLE * segment + SEGMENT_ANGLE / 2));
      setRotation(targetAngle);

      setTimeout(() => {
        if (data.won) {
          setDiscount(data.discountPercent);
          setState("result-win");
          localStorage.setItem("spin-played", "1");
          // Celebratory burst — gold & rose brand confetti
          const winColors = ["#c2a36b", "#c98b88", "#dbc5a0", "#a96d6c", "#fdfaf7"];
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.5 },
            colors: winColors,
          });
          setTimeout(
            () =>
              confetti({
                particleCount: 60,
                spread: 90,
                origin: { x: 0.25, y: 0.45 },
                colors: winColors,
              }),
            250
          );
          setTimeout(
            () =>
              confetti({
                particleCount: 60,
                spread: 90,
                origin: { x: 0.75, y: 0.45 },
                colors: winColors,
              }),
            500
          );
        } else {
          setState("result-lose");
          localStorage.setItem("spin-played", "1");
          // Gentle falling particles — muted nude/blush tones
          const loseColors = ["#efe0d6", "#f6e3e0", "#ecc9c6", "#dba8a6", "#f7efe8"];
          confetti({
            particleCount: 40,
            spread: 120,
            origin: { y: 0.3 },
            colors: loseColors,
            gravity: 0.6,
            drift: 0.5,
            scalar: 0.8,
            ticks: 150,
          });
          setTimeout(
            () =>
              confetti({
                particleCount: 25,
                spread: 140,
                origin: { x: 0.4, y: 0.25 },
                colors: loseColors,
                gravity: 0.5,
                drift: -0.3,
                scalar: 0.7,
                ticks: 120,
              }),
            400
          );
        }
      }, 4200);
    } catch {
      setState("error");
    }
  };

  const renderWheel = () => {
    const cx = 160;
    const cy = 160;
    const r = 148;
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

      const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const textR = r * 0.68;
      const tx = cx + textR * Math.cos(midAngle);
      const ty = cy + textR * Math.sin(midAngle);
      const textRotation = (i + 0.5) * SEGMENT_ANGLE;

      segments.push(
        <g key={i}>
          <path
            d={path}
            fill={SEGMENT_COLORS[i]}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
          />
          {/* Thin inner separator lines for depth */}
          <line
            x1={cx}
            y1={cy}
            x2={x1}
            y2={y1}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
          />
          <text
            x={tx}
            y={ty}
            fill={SEGMENT_TEXT_COLORS[i]}
            fontSize="11"
            fontWeight="600"
            fontFamily="inherit"
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${textRotation}, ${tx}, ${ty})`}
            style={{ letterSpacing: "0.05em" }}
          >
            {segmentLabels[i]}
          </text>
        </g>
      );
    }

    return segments;
  };

  return (
    <div className="flex flex-col items-center gap-5 px-5 pt-6 pb-5">
      {/* Pointer */}
      <div className="relative">
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 drop-shadow-md">
          <svg width="24" height="20" viewBox="0 0 24 20">
            <polygon
              points="12,20 0,0 24,0"
              fill="#c2a36b"
              stroke="#a96d6c"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Wheel with outer ring */}
        <div
          className="rounded-full p-[6px]"
          style={{
            background: "linear-gradient(135deg, #c2a36b 0%, #dbc5a0 40%, #c2a36b 60%, #a88f5a 100%)",
            boxShadow: "0 8px 32px rgba(58,44,42,0.18), 0 2px 8px rgba(201,139,136,0.2), inset 0 1px 1px rgba(255,255,255,0.3)",
          }}
        >
          <div
            className="rounded-full p-[2px]"
            style={{ background: "linear-gradient(135deg, #3a2c2a, #7d5a5c)" }}
          >
            <svg
              ref={wheelRef}
              width="320"
              height="320"
              viewBox="0 0 320 320"
              className="max-w-[280px] sm:max-w-[320px] rounded-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: state === "spinning" ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              }}
            >
              <defs>
                <radialGradient id="wheelSheen" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
                </radialGradient>
                <filter id="innerShadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="0" dy="2" />
                  <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
                  <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                  <feBlend in2="SourceGraphic" />
                </filter>
              </defs>
              {/* Outer decorative ring */}
              <circle cx="160" cy="160" r="158" fill="none" stroke="rgba(194,163,107,0.15)" strokeWidth="1" />
              {renderWheel()}
              {/* Sheen overlay */}
              <circle cx="160" cy="160" r="148" fill="url(#wheelSheen)" pointerEvents="none" />
              {/* Center hub */}
              <circle
                cx="160"
                cy="160"
                r="30"
                fill="url(#centerGrad)"
                stroke="#c2a36b"
                strokeWidth="2.5"
                filter="url(#innerShadow)"
              />
              <defs>
                <radialGradient id="centerGrad" cx="40%" cy="35%">
                  <stop offset="0%" stopColor="#fdfaf7" />
                  <stop offset="100%" stopColor="#f7efe8" />
                </radialGradient>
              </defs>
              {/* Decorative dots around center */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const dotR = 22;
                return (
                  <circle
                    key={`dot-${i}`}
                    cx={160 + dotR * Math.cos(angle)}
                    cy={160 + dotR * Math.sin(angle)}
                    r="1.2"
                    fill="#c2a36b"
                    opacity="0.6"
                  />
                );
              })}
              <text
                x="160"
                y="160"
                fill="#a96d6c"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="inherit"
                style={{ letterSpacing: "0.15em" }}
              >
                SPIN
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* State-dependent content */}
      {state === "idle" && (
        <div className="w-full max-w-xs space-y-3 text-center">
          <h3 className="text-lg font-semibold tracking-tight text-ink">{t("title")}</h3>
          <p className="text-sm text-muted leading-relaxed">{t("subtitle")}</p>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
            placeholder={t("emailPlaceholder")}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-nude-50 focus:outline-none focus:ring-2 focus:ring-rose/40 focus:border-rose transition-all ${
              emailError ? "border-red-400 ring-1 ring-red-400" : "border-line"
            }`}
          />
          {emailError && (
            <p className="text-xs text-red-500">{t("invalidEmail")}</p>
          )}
          <button
            onClick={handleSpin}
            className="w-full py-3 text-sm font-semibold rounded-xl text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #c98b88 0%, #a96d6c 100%)",
              boxShadow: "0 2px 8px rgba(169,109,108,0.3)",
            }}
          >
            {t("spinButton")}
          </button>
        </div>
      )}

      {state === "spinning" && (
        <div className="text-center">
          <p className="text-sm font-medium text-muted animate-pulse tracking-wide">{t("spinning")}</p>
        </div>
      )}

      {state === "result-win" && (
        <div className="w-full max-w-xs text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20">
            <span className="text-lg font-bold text-gold">{t("won", { discount })}</span>
          </div>
          <p className="text-sm text-muted">{t("wonSub")}</p>
          <a
            href="/offer"
            className="inline-flex px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #c98b88 0%, #a96d6c 100%)",
              boxShadow: "0 2px 8px rgba(169,109,108,0.3)",
            }}
          >
            {t("viewOffer")}
          </a>
        </div>
      )}

      {state === "result-lose" && (
        <div className="w-full max-w-xs text-center space-y-3">
          <h3 className="text-lg font-semibold text-ink">{t("lost")}</h3>
          <p className="text-sm text-muted">{t("lostSub")}</p>
          <a
            href="/offer"
            className="inline-flex px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #c98b88 0%, #a96d6c 100%)",
              boxShadow: "0 2px 8px rgba(169,109,108,0.3)",
            }}
          >
            {t("viewOffer")}
          </a>
        </div>
      )}

      {state === "already-played" && (
        <div className="w-full max-w-xs text-center space-y-3">
          <h3 className="text-lg font-semibold text-ink">{t("alreadyPlayed")}</h3>
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
          <h3 className="text-lg font-semibold text-ink">{t("tooManyAttempts")}</h3>
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
