import type { Metadata } from 'next';
import { Geist, Geist_Mono, Oi } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const oi = Oi({
  variable: '--font-oi',
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'Text-to-Color: Input text, get color',
  description: 'Input text, get color',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta
          property="og:title"
          content="Text-to-Color: Input text, get color"
        />
        <meta property="og:description" content="Input text, get color" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://text-to-color.com" />
        <meta
          property="og:image"
          content="https://text-to-color.com/og-image.png"
        />
        <meta
          property="og:image:alt"
          content="Text-to-Color application screenshot"
        />
        <meta property="og:site_name" content="Text-to-Color" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Text-to-Color: Input text, get color"
        />
        <meta name="twitter:description" content="Input text, get color" />
        <meta
          name="twitter:image"
          content="https://text-tocolor.com/og-image.png"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
