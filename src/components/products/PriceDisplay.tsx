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
      {label && <span className="text-gray-500 text-xs mr-1">{label}</span>}
      {formatCZK(halere)}
      {perGram && <span className="text-gray-400 text-xs">/g</span>}
    </span>
  );
}
