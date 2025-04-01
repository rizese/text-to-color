import React from 'react';
import TextToColorClient, { TextToColor } from '@/components/TextToColorClient';
import { getColorFromText } from './actions';
import { Metadata } from 'next';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Text~to~Color',
  description: 'Convert text descriptions to color values using AI',
};

export default async function Page({
  searchParams,
}: {
  searchParams: { t: string | string[] | undefined };
}) {
  // handle ?t=color search params
  const { t: paramValue } = await searchParams;
  if (paramValue && typeof paramValue === 'string') {
    const text = decodeURIComponent(paramValue);
    const color = await getColorFromText(text, false, []);
    const textToColor: TextToColor = {
      text,
      color: color.color,
    };
    console.log('prefetching text to color', textToColor);
    return <TextToColorClient initialColor={textToColor} />;
  }

  return <TextToColorClient />;
}
