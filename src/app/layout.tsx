import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Altus Tribe",
  description: "An invited circle. Elevated belonging.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        {/* Headless Clerk: point at our own auth pages so Clerk never renders or
            redirects to its default UI. Our /login, /signup etc. stay unchanged. */}
        <ClerkProvider signInUrl="/login" signUpUrl="/signup">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}