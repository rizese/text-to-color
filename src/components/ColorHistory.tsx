import React from "react";
import { History, X, ChevronLeft, ChevronRight } from "lucide-react";

interface ColorHistoryProps {
  colors: Array<{
    color: string;
    text: string;
    timestamp: Date;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  onSelectColor: (color: string) => void;
}

const ColorHistory = ({
  colors,
  isOpen,
  onToggle,
  onSelectColor,
}: ColorHistoryProps) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white/90 backdrop-blur-md shadow-lg transition-all duration-300 transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ width: "320px" }}
    >
      <button
        onClick={onToggle}
        className="absolute top-1/2 -left-8 transform -translate-y-1/2 bg-white/90 p-2 rounded-l-lg shadow-lg"
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <h3 className="font-medium">Color History</h3>
          </div>
          <button onClick={onToggle}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto">
          {colors.map((item, index) => (
            <button
              key={index}
              onClick={() => onSelectColor(item.color)}
              className="w-full p-3 rounded-lg hover:bg-black/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md shadow-inner"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium truncate">
                    {item.text}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorHistory;
