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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
