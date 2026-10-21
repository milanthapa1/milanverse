"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserProfile } from "@/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Account menu.
 *
 * - `user === null` (signed out / demo without session): sign-in CTA.
 * - Auth mode: dropdown gains a Sign out action (Auth.js client `signOut`).
 */
export function UserMenu({
  user,
  authEnabled,
}: {
  user: UserProfile | null;
  authEnabled: boolean;
}) {
  if (!user) {
    return (
      <Button
        render={<Link href="/signin" />}
        nativeButton={false}
        variant="outline"
        size="sm"
        className="rounded-full"
      >
        Sign in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-8">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/collection" />}>
          My Collection
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/favorites" />}>
          Favorites
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="size-4" aria-hidden />
          Settings
        </DropdownMenuItem>
        {authEnabled && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              nativeButton
              render={
                <button
                  type="button"
                  onClick={() => void signOut({ redirectTo: "/" })}
                />
              }
            >
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
