import { AddLinkDialog } from "@/components/links/add-link-dialog";
import {
  CommandPalette,
  CommandPaletteTrigger,
} from "@/components/effects/command-palette";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { Category, UserProfile } from "@/types";

/**
 * Top bar for the app shell: the ⌘K palette trigger (which also handles full
 * search), the add-link flow, theme toggle and account menu.
 *
 * `user` is null for signed-out (stale-session) requests — `UserMenu` then
 * renders a sign-in CTA instead of the avatar dropdown.
 */
export function AppHeader({
  user,
  authEnabled,
  categories,
}: {
  user: UserProfile | null;
  authEnabled: boolean;
  categories: Category[];
}) {
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-x-0 border-t-0 px-4 sm:px-6">
      <Logo href="/dashboard" className="md:hidden" />

      <div className="relative w-full max-w-md md:ml-2">
        <CommandPaletteTrigger />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <AddLinkDialog categories={categories} />
        <ThemeToggle />
        <UserMenu user={user} authEnabled={authEnabled} />
      </div>

      <CommandPalette categories={categories} />
    </header>
  );
}
