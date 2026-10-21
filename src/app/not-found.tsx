import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-primary">404</p>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">This corner of the universe is empty</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has drifted
          into another orbit.
        </p>
      </div>
      <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
        <Compass className="size-4" aria-hidden />
        Back to your universe
      </Link>
    </main>
  );
}
