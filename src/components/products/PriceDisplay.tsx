"use client";

import { formatCZK } from "@/lib/pricing";

interface PriceDisplayProps {
  halere: number;
  label?: string;
  className?: string;
  perGram?: boolean;
}

export function PriceDisplay({
  halere,
  label,
  className = "",
  perGram = false,
}: PriceDisplayProps) {
  return (
    <span className={className}>
      {label && <span className="text-muted text-xs mr-1">{label}</span>}
      {formatCZK(halere)}
      {perGram && <span className="text-muted text-xs">/g</span>}
    </span>
  );
}
