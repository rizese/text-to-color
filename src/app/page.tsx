"use client";

import React, { useState, useEffect, useRef } from "react";
import { Palette, Copy, Check } from "lucide-react";
import ColorControls from "@/components/ColorControls";
import ColorHistory from "@/components/ColorHistory";

interface ColorPlaceholder {
  text: string;
  color: string;
}

const placeholders: ColorPlaceholder[] = [
  { text: "a babbling mountain brook", color: "#4c8c64" },
  { text: "tikka masala curry", color: "#d2693c" },
  { text: "glow in the dark", color: "#9be89b" },
];

export default function Page() {
  const [inputText, setInputText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const [currentColor, setCurrentColor] = useState(placeholders[0].color);
  const [colorMode, setColorMode] = useState<"dark" | "light">("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [colorHistory, setColorHistory] = useState<
    Array<{
      color: string;
      text: string;
      timestamp: Date;
    }>
  >([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  // Rotate placeholders every 8 seconds with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setIsPlaceholderVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const isDarkOrLightColor = (hexColor: string): "dark" | "light" => {
    // Remove the # if present
    const hex = hexColor.replace("#", "");

    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance using the relative luminance formula
    // Using coefficients from WCAG 2.0
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return "light" if luminance is high, "dark" if low
    return luminance > 0.5 ? "light" : "dark";
  };

  // Update current color and text color mode when placeholder changes
  useEffect(() => {
    const newColor = placeholders[placeholderIndex].color;
    setCurrentColor(newColor);
    setColorMode(isDarkOrLightColor(newColor));
  }, [placeholderIndex]);

  // Update text color mode when current color changes manually
  useEffect(() => {
    setColorMode(isDarkOrLightColor(currentColor));
  }, [currentColor]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // TODO: Implement API call
      handleNewColor(placeholders[placeholderIndex].color, inputText);
      setInputText("");
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      // TODO: Implement API call with history
      handleNewColor(placeholders[placeholderIndex].color, inputText);
      setInputText("");
    }
  };

  const handleNewColor = (color: string, text: string) => {
    setColorHistory((prev) => [
      {
        color,
        text,
        timestamp: new Date(),
      },
      ...prev,
    ]);
    setCurrentColor(color);
  };

  // Color conversion utilities
  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const hexToHsl = (hex: string): string => {
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

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(
      l * 100
    )}%)`;
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setCopiedFormat(null);
    }, 2000);
  };

  const ColorValue = ({
    label,
    value,
    className,
  }: {
    label: string;
    value: string;
    className: string;
  }) => (
    <button
      onClick={() => copyToClipboard(value, label)}
      className={`flex flex-row items-center gap-2 px-3 py-2 text-sm ${bgColorClass} rounded-lg shadow-sm transition-all ${className}`}
    >
      <span className={`font-mono flex-1 ${textColorClass}`}>{value}</span>
      <div>
        {copiedFormat === label ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className={`w-4 h-4 ${textColorClass}`} />
        )}
      </div>
    </button>
  );

  // const ta = " transition-all";
  const ta = "";
  const textColorClass =
    (colorMode === "dark" ? "text-white" : "text-gray-900") + ta;
  const borderColorClass =
    (colorMode === "dark" ? "border-white/30" : "border-gray-900/30") + ta;
  const focusBorderColorClass =
    (colorMode === "dark"
      ? "focus:border-white/50"
      : "focus:border-gray-900/50") + ta;
  const focusRingColorClass =
    (colorMode === "dark" ? "focus:ring-white/20" : "focus:ring-gray-900/20") +
    ta;
  const placeholderColorClass =
    (colorMode === "dark"
      ? "placeholder-white/70"
      : "placeholder-gray-900/70") + ta;
  const bgColorClass =
    (colorMode === "dark" ? "bg-white/10" : "bg-gray-900/10") + ta;

  return (
    <main
      className="min-h-screen duration-1000 ease-in-out flex items-center justify-center transition-all"
      style={{ backgroundColor: currentColor }}
    >
      <div className="w-full max-w-2xl p-8">
        <div className="flex items-center justify-center mb-8">
          <Palette className={`w-8 h-8 mr-2 ${textColorClass}`} />
          <h1 className={`text-2xl font-bold ${textColorClass}`}>
            Text to Color
          </h1>
        </div>

        <div className="relative mb-8">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`
                w-full p-4 text-lg border-2 rounded-xl 
                focus:ring-2 outline-none resize-none
                ${textColorClass} ${borderColorClass} ${focusBorderColorClass} 
                ${focusRingColorClass} ${bgColorClass}
              `}
              rows={1}
              style={{
                minHeight: "3rem",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <div
              className={`
                absolute inset-0 pointer-events-none p-4 text-lg
                ${isPlaceholderVisible ? "opacity-100" : "opacity-0"}
                ${textColorClass}
              `}
            >
              {inputText === "" ? placeholders[placeholderIndex].text : ""}
            </div>
          </div>
          {/* <div
            className={`absolute bottom-3 right-3 text-sm ${placeholderColorClass} ${textColorClass} transition-all`}
          >
            <span className={`${bgColorClass} p-1 my-1 text-xs rounded-md`}>
              Enter
            </span>{" "}
            to send,{" "}
            <span className={`${bgColorClass} p-1 my-1 text-xs rounded-md`}>
              Shift+Enter
            </span>{" "}
            to continue
          </div> */}
        </div>

        <div className="w-full mb-8 flex flex-row justify-center gap-2">
          <ColorValue className="w-1/5" label="HEX" value={currentColor} />
          <ColorValue
            className="w-1/3"
            label="RGB"
            value={hexToRgb(currentColor)}
          />
          <ColorValue
            className="w-1/3"
            label="HSL"
            value={hexToHsl(currentColor)}
          />
        </div>
      </div>

      <ColorHistory
        colors={colorHistory}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectColor={setCurrentColor}
      />
    </main>
  );
}
