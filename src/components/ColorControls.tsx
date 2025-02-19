import React from "react";
import { Eye } from "lucide-react";

interface ColorControlsProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorControls = ({ color, onChange }: ColorControlsProps) => {
  // Convert hex to HSL values for sliders
  const hexToHsl = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  };

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const [h, s, l] = hexToHsl(color);

  const handleChange = (type: "h" | "s" | "l", value: number) => {
    const newValues = {
      h: type === "h" ? value : h,
      s: type === "s" ? value : s,
      l: type === "l" ? value : l,
    };
    onChange(hslToHex(newValues.h, newValues.s, newValues.l));
  };

  return (
    <div className="p-4 bg-white/90 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5" />
        <h3 className="font-medium">Color Controls</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Hue</label>
          <input
            type="range"
            min="0"
            max="360"
            value={h}
            onChange={(e) => handleChange("h", Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, 
                hsl(0, ${s}%, ${l}%),
                hsl(60, ${s}%, ${l}%),
                hsl(120, ${s}%, ${l}%),
                hsl(180, ${s}%, ${l}%),
                hsl(240, ${s}%, ${l}%),
                hsl(300, ${s}%, ${l}%),
                hsl(360, ${s}%, ${l}%))`,
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Saturation</label>
          <input
            type="range"
            min="0"
            max="100"
            value={s}
            onChange={(e) => handleChange("s", Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, 
                hsl(${h}, 0%, ${l}%),
                hsl(${h}, 100%, ${l}%))`,
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Lightness</label>
          <input
            type="range"
            min="0"
            max="100"
            value={l}
            onChange={(e) => handleChange("l", Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, 
                hsl(${h}, ${s}%, 0%),
                hsl(${h}, ${s}%, 50%),
                hsl(${h}, ${s}%, 100%))`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ColorControls;
