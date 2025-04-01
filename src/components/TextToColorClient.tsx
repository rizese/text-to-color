'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, CircleX } from 'lucide-react';
import GitHubButton from 'react-github-btn';
import { hexToHsl, isDarkOrLightColor } from '@/lib/color-utils';
import { hexToRgb } from '@/lib/color-utils';
import { getColorFromText } from '@/app/actions';

interface TextToColorProps {
  initialColor?: TextToColor;
  isServerLoading?: boolean;
}

export interface TextToColor {
  text: string;
  color: string; // this is a hex
}

const placeholders: TextToColor[] = [
  { text: 'an Alaskan freshwater stream', color: '#6fbfbf' },
  { text: 'tikka masala curry', color: '#d2693c' },
  { text: 'glow in the dark', color: '#9be89b' },
  { text: 'whiskey, neat, on the rocks', color: '#b57a4a' },
  { text: 'an existential crisis', color: '#4a5a6b' },
];

export default function TextToColorClient({
  initialColor,
  isServerLoading = false,
}: TextToColorProps) {
  const defaultColor = initialColor?.color || placeholders[0].color;
  // this is a hex - source of truth for color
  const [currentColor, setCurrentColor] = useState(defaultColor);
  // this is the input text in the main text area
  const [inputText, setInputText] = useState(initialColor?.text || '');
  // rotates and fades the placeholder text
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  // color mode changes based on currentColor and helps with text contrast
  const [colorMode, setColorMode] = useState<'dark' | 'light'>(
    isDarkOrLightColor(defaultColor),
  );
  const [isInputFocused, setIsInputFocused] = useState(false);
  // this gets toggled when shift is pressed
  const [isUsingChatHistory, setIsUsingChatHistory] = useState(false);
  const [history, setHistory] = useState<TextToColor[]>([
    ...(initialColor ? [initialColor] : []),
  ]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchParams, setShowSearchParams] = useState(
    !!initialColor?.text,
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const flippedColorMode = colorMode === 'dark' ? 'light' : 'dark';

  // toggle touched when input is focused
  useEffect(() => {
    if (inputText.length > 0) {
      setTouched(true);
    }
  }, [inputText]);

  // Rotate placeholders every 8 seconds with fade animation
  useEffect(() => {
    // Only set up the interval if input is not focused and hasn't been touched
    if (!isInputFocused && !touched && !initialColor) {
      intervalRef.current = setInterval(() => {
        setIsPlaceholderVisible(false);
        setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
          setIsPlaceholderVisible(true);
        }, 300);
      }, 8000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInputFocused, touched, initialColor]);

  // Toggle history display when shift key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsUsingChatHistory((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setInputText('');
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update current color and text color mode when placeholder changes
  useEffect(() => {
    if (!initialColor) {
      const newColor = placeholders[placeholderIndex].color;
      debugger;
      setCurrentColor(newColor);
      setColorMode(isDarkOrLightColor(newColor));
    }
  }, [placeholderIndex, initialColor]);

  // Update text color mode when current color changes manually
  useEffect(() => {
    setColorMode(isDarkOrLightColor(currentColor));
  }, [currentColor]);

  // handle search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      // Clear existing search parameters
      url.search = '';

      // Add text parameter only when not using chat history
      if (!isUsingChatHistory && inputText && showSearchParams) {
        url.searchParams.set('t', inputText);
      }

      // Use replaceState instead of pushState to avoid adding to browser history
      // This won't cause a re-render since we're not using Next.js router
      window.history.replaceState({}, '', url.toString());
    }
  }, [inputText, isUsingChatHistory, showSearchParams]);

  const handleEnterKey = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputText.length === 0) {
        return;
      }
      await handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputText.length === 0 || isLoading || isServerLoading) {
      return;
    }

    setIsLoading(true);

    try {
      // Store current input for restoration
      const currentInput = inputText;

      // Get color from server action directly
      const result = await getColorFromText(inputText, isUsingChatHistory, []);

      if (!result.error) {
        // Add to history if using Shift+Enter, otherwise reset history
        if (isUsingChatHistory) {
          setHistory((prev) => [
            ...prev,
            { text: currentInput, color: result.color },
          ]);
        } else {
          setHistory([{ text: currentInput, color: result.color }]);
          setShowSearchParams(true);
        }
        setCurrentColor(result.color);
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsLoading(false);
    }
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

  const CopyColorButton = ({
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
          <Check className={`w-4 h-4 ${textColorClass}`} />
        ) : (
          <Copy className={`w-4 h-4 ${textColorClass}`} />
        )}
      </div>
    </button>
  );

  // tailwind classes that switch between dark and light mode based on currentColor
  const textColorClass = colorMode === 'dark' ? 'text-white' : 'text-gray-900';
  const textOpacityColorClass =
    colorMode === 'dark'
      ? 'text-white/70 hover:text-white'
      : 'text-gray-900/80 hover:text-gray-900';
  const borderColorClass =
    colorMode === 'dark' ? 'border-white/30' : 'border-gray-900/30';
  const focusBorderColorClass =
    colorMode === 'dark' ? 'focus:border-white/50' : 'focus:border-gray-900/50';
  const focusRingColorClass =
    colorMode === 'dark' ? 'focus:ring-white/20' : 'focus:ring-gray-900/20';
  const placeholderColorClass =
    colorMode === 'dark' ? 'placeholder-white/70' : 'placeholder-gray-900/70';
  const bgColorClass = colorMode === 'dark' ? 'bg-white/10' : 'bg-gray-900/10';
  const bgHoverColorClass =
    colorMode === 'dark' ? 'hover:bg-white/20' : 'hover:bg-gray-900/20';
  const selectionColorClass =
    colorMode === 'dark' ? 'selection:bg-white/20' : 'selection:bg-gray-900/20';

  // tailwind classes that scale the history items based on their position
  const historyClass = (index: number, length: number): string => {
    const posFromEnd = length - 1 - index;

    switch (posFromEnd) {
      case 0: // Last element
        return 'scale-1 z-40';
      case 1: // Second-to-last
        return 'scale-[0.85] -mb-2 z-30';
      case 2: // Third-to-last
        return 'scale-[0.7] -mb-4 z-20';
      case 3: // Fourth-to-last
        return 'scale-[0.55] -mb-6 z-10';
      default: // Earlier elements or invalid indices
        return 'hidden';
    }
  };

  return (
    <div
      className={`w-screen h-dvh ${bgColorClass} ${selectionColorClass} md:p-[5rem] p-0 flex flex-col items-center justify-center`}
    >
      <main
        className="w-full h-full rounded-[3.2rem] flex flex-col relative items-center justify-center"
        style={{
          backgroundColor: currentColor,
          transition: 'background-color 0.3s ease',
        }}
      >
        {/* Logo */}
        <div
          className={`absolute md:w-auto w-[calc(100%-1rem)] top-0 left-0 rounded-[3rem] flex items-center justify-center py-6 px-12 m-2 ${bgColorClass} ${textOpacityColorClass}`}
        >
          <h1 className={`text-2xl sm:text-4xl pt-2 cursor-pointer font-oi`}>
            Text~to~Color
          </h1>
        </div>
        {/* GitHub button */}
        <div
          className={
            `md:absolute top-0 right-0 rounded-lg md:rounded-[3rem] ${bgColorClass} ` +
            `flex items-center justify-center md:py-6 md:px-12 p-2 md:m-2`
          }
        >
          <div className="flex items-center md:h-12 min-h-[2rem]">
            <GitHubButton
              href="https://github.com/rizese/text-to-color"
              data-color-scheme={`no-preference: ${flippedColorMode}; light: ${flippedColorMode}; dark: ${flippedColorMode};`}
              data-size="large"
              data-show-count="true"
              aria-label="Star rizese/text-to-color on GitHub"
            >
              Star
            </GitHubButton>
          </div>
        </div>
        {/* History */}
        <div className="w-full max-w-2xl p-8 relative">
          {isUsingChatHistory && history.length > 0 && (
            <div
              className={`w-4/5 mx-auto flex flex-col gap-0 mb-2 items-center`}
            >
              {history.map((item, index) => (
                <button
                  key={index}
                  data-index={index}
                  className={`p-3 w-full rounded-xl ${historyClass(
                    index,
                    history.length,
                  )}  border border-2 ${borderColorClass}`}
                  style={{
                    backgroundColor: currentColor,
                    transition: 'background-color 0.3s ease',
                  }}
                  onClick={() => {
                    setInputText(item.text);
                    setCurrentColor(item.color);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md border border-2 ${borderColorClass}`}
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className={`${textColorClass} italic truncate`}>
                      &quot;{item.text}&quot;
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* Input */}
          <div className="relative mb-8">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setShowSearchParams(false);
                }}
                onKeyDown={handleEnterKey}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                enterKeyHint="send"
                className={`
                w-full p-4 text-lg border-2 rounded-xl
                focus:ring-2 outline-none resize-none
                overflow-hidden
                ${textColorClass} ${borderColorClass} ${focusBorderColorClass}
                ${focusRingColorClass} ${bgColorClass}
                ${isLoading || isServerLoading ? 'opacity-50 cursor-wait' : ''}
              `}
                rows={1}
                style={{
                  minHeight: '4rem',
                  height: 'auto',
                }}
                disabled={isLoading || isServerLoading}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              {inputText && !isLoading && !isServerLoading && (
                <button
                  onClick={() => {
                    setInputText('');
                    inputRef.current?.focus();
                  }}
                  className={`absolute right-3 top-4 md:top-3 rounded-full p-1 hover:bg-black/10 transition-colors`}
                >
                  <CircleX className={`w-6 h-6 ${textColorClass}`} />
                </button>
              )}
              {!inputText.length && !isInputFocused && !touched && (
                <div
                  className={`
                absolute inset-0 pointer-events-none p-4 text-lg
                ${isPlaceholderVisible ? 'opacity-100' : 'opacity-0'}
                ${textColorClass}
              `}
                >
                  {placeholders[placeholderIndex].text}
                </div>
              )}
              {(isLoading || isServerLoading) && (
                <div className="absolute right-3 top-4 md:top-3 p-1 ">
                  <div
                    className={`animate-spin h-6 w-6 border-2 border-t-transparent rounded-full ${borderColorClass}`}
                  ></div>
                </div>
              )}
            </div>
            <div
              className={`sm:absolute bottom-3.5 right-3 text-xxs ${placeholderColorClass} ${textColorClass} text-right`}
            >
              <span className={`${bgColorClass} p-1 rounded-md`}>Enter</span> to
              send,{' '}
              <span className={`${bgColorClass} p-1 rounded-md`}>Shift</span> to
              toggle chat history,{' '}
              <span className={`${bgColorClass} p-1 rounded-md`}>Esc</span> to
              clear input
            </div>
          </div>
          {/* Color values */}
          <div className="w-full mb-8 flex flex-col md:flex-row justify-center items-center gap-2">
            <CopyColorButton
              className={`w-full sm:w-2/3 md:w-auto ${bgHoverColorClass}`}
              label="HEX"
              value={currentColor}
            />
            <CopyColorButton
              className={`w-full sm:w-2/3 md:w-auto ${bgHoverColorClass}`}
              label="RGB"
              value={hexToRgb(currentColor)}
            />
            <CopyColorButton
              className={`w-full sm:w-2/3 md:w-auto ${bgHoverColorClass}`}
              label="HSL"
              value={hexToHsl(currentColor)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
