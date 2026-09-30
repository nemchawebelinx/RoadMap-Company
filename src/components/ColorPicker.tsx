"use client";
import React from "react";
import { PALETTE_COLORS, colorToHex } from "@/lib/palette";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PALETTE_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: colorToHex(c),
            borderColor: value === c ? "#fff" : "transparent",
          }}
        />
      ))}
    </div>
  );
}
