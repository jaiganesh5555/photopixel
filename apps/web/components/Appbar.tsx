"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Credits } from "./navbar/Credits";
import Link from "next/link";

export function Appbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 transition-colors hover:opacity-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span className="hidden font-bold font-mono text-xl sm:inline-block">
              100xPhoto
            </span>
          </Link>

          {/* Auth & Pricing */}
          <div className="flex items-center gap-4">
            <SignedIn>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Credits />
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox:
                      "h-8 w-8 rounded-full ring-2 ring-primary/10 transition-all hover:ring-primary/30",
                    userButtonPopover: "right-0 mt-2",
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <SignInButton mode="modal">
                  <span>Sign In</span>
                </SignInButton>
              </Button>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
