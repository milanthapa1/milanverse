import type { Metadata } from "next";
import { Suspense } from "react";
import { FadeIn } from "@/components/effects/motion";
import { Features } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { LandingNavbar } from "@/components/landing/navbar";
import { Showcase, ShowcaseSkeleton } from "@/components/landing/showcase";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <Hero />
        <FadeIn>
          <Features />
        </FadeIn>
        {/* Showcase renders time-relative data (popularity decay, "last
            opened"), so it streams in behind a boundary. */}
        <Suspense fallback={<ShowcaseSkeleton />}>
          <FadeIn>
            <Showcase />
          </FadeIn>
        </Suspense>
      </main>
      <LandingFooter />
    </div>
  );
}
