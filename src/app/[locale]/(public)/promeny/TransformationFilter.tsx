"use client";

import { useState } from "react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

interface TransformationItem {
  id: string;
  title: string;
  description: string | null;
  photoBefore: string;
  photoAfter: string;
  processingType: string;
  lengthCm: number | null;
  weightGrams: number | null;
  hairOrigin: string | null;
}

interface TransformationFilterProps {
  items: TransformationItem[];
  methodLabels: Record<string, string>;
  filterAllLabel: string;
  beforeLabel: string;
  afterLabel: string;
  lengthLabel: string;
  weightLabel: string;
}

const FILTER_TYPES = ["CLIP_IN", "TAPE_IN", "KERATIN", "WEFT", "MICRO_RING", "BANGS"] as const;

export function TransformationFilter({
  items,
  methodLabels,
  filterAllLabel,
  beforeLabel,
  afterLabel,
  lengthLabel,
  weightLabel,
}: TransformationFilterProps) {
  const [selected, setSelected] = useState<string>("ALL");

  const filtered = selected === "ALL" ? items : items.filter((t) => t.processingType === selected);

  const availableTypes = FILTER_TYPES.filter((type) => items.some((t) => t.processingType === type));

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelected("ALL")}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            selected === "ALL"
              ? "bg-espresso text-white border-espresso"
              : "bg-nude-50 text-muted border-line hover:border-blush-200"
          }`}
        >
          {filterAllLabel}
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelected(type)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              selected === type
                ? "bg-espresso text-white border-espresso"
                : "bg-nude-50 text-muted border-line hover:border-blush-200"
            }`}
          >
            {methodLabels[type] ?? type}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-nude-50 rounded-xl border border-line overflow-hidden">
            <BeforeAfterSlider
              before={item.photoBefore}
              after={item.photoAfter}
              beforeLabel={beforeLabel}
              afterLabel={afterLabel}
              alt={item.title}
            />
            <div className="p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted font-medium">
                {methodLabels[item.processingType] ?? item.processingType}
              </span>
              <h3 className="text-sm font-semibold text-ink mt-0.5 line-clamp-1">{item.title}</h3>
              {(item.lengthCm || item.weightGrams) && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                  {item.lengthCm && <span>{lengthLabel}: {item.lengthCm} cm</span>}
                  {item.weightGrams && <span>{weightLabel}: {item.weightGrams}g</span>}
                </div>
              )}
              {item.description && (
                <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
