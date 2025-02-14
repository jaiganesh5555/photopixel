import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Credits } from "./navbar/Credits";
import Link from "next/link";

export function Appbar() {
  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex gap-6 md:gap-10">
          <Link
            href="/"
            className="flex items-center space-x-2 transition-colors hover:text-foreground/80"
          >
            {/* You can add your logo here */}
            <span className="hidden font-bold sm:inline-block">PhotoAI</span>
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/dashboard"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/80"
            >
              Dashboard
            </Link>
            <Link
              href="/pricing"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/80"
            >
              Pricing
            </Link>
          </nav>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <SignedIn>
            <Credits />
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox:
                    "h-8 w-8 rounded-full ring-2 ring-primary/10 transition-all hover:ring-primary/30",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <Button variant="default" size="sm" asChild>
              <SignInButton mode="modal">
                <span className="flex items-center gap-2">
                  Sign In
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </span>
              </SignInButton>
            </Button>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
