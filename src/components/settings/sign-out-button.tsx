"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/** Auth.js sign-out (clears the session cookie and returns to the landing). */
export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void signOut({ redirectTo: "/" })}
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </Button>
  );
}
