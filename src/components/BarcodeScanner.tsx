"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  active: boolean;
}

export function BarcodeScanner({ onScan, onClose, active }: BarcodeScannerProps) {
  const t = useTranslations("sale");
  const tCommon = useTranslations("common");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleScan = useCallback(
    (code: string) => {
      if (navigator.vibrate) navigator.vibrate(100);
      stopCamera();
      onScan(code);
    },
    [onScan, stopCamera]
  );

  useEffect(() => {
    if (!active) {
      stopCamera();
      return;
    }

    let cancelled = false;
    let animFrame: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let zxingReader: any = null;

    async function startScanning() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);

        if ("BarcodeDetector" in window) {
          // Native BarcodeDetector API (Chrome, Edge, Android)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({
            formats: ["code_128", "ean_13", "ean_8", "qr_code"],
          });

          const detect = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                handleScan(barcodes[0].rawValue);
                return;
              }
            } catch {
              // frame not ready
            }
            animFrame = requestAnimationFrame(detect);
          };
          detect();
        } else {
          // Fallback: @zxing/library (Safari, iOS, Firefox)
          try {
            const { BrowserMultiFormatReader } = await import("@zxing/library");
            zxingReader = new BrowserMultiFormatReader();

            const deviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;

            zxingReader.decodeFromVideoDevice(
              deviceId ?? null,
              videoRef.current,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (result: any, err: any) => {
                if (cancelled) return;
                if (result) {
                  handleScan(result.getText());
                }
                // err is expected when no barcode found in frame
                if (err && err.name !== "NotFoundException") {
                  // real error — ignore silently
                }
              }
            );
          } catch {
            setError(t("scannerNotSupported"));
          }
        }
      } catch {
        setError(t("cameraPermission"));
      }
    }

    startScanning();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrame);
      if (zxingReader) {
        try { zxingReader.reset(); } catch { /* ignore */ }
      }
      stopCamera();
    };
  }, [active, handleScan, stopCamera, t]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-medium">{t("scanBarcode")}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
          {tCommon("cancel")}
        </Button>
      </div>

      {scanning && (
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-40 border-2 border-white/60 rounded-lg" />
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center text-white px-8 text-center">
          {error}
        </div>
      )}

      <div className="p-4 bg-black/80">
        <p className="text-gray-300 text-sm mb-2">{t("manualEntry")}</p>
        <div className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="HR-..."
            className="bg-gray-800 text-white border-gray-600"
            onKeyDown={(e) => {
              if (e.key === "Enter" && manualCode.trim()) {
                handleScan(manualCode.trim());
              }
            }}
          />
          <Button
            onClick={() => {
              if (manualCode.trim()) handleScan(manualCode.trim());
            }}
            disabled={!manualCode.trim()}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
