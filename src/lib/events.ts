/**
 * Window-level events that let independently mounted client components
 * coordinate without a shared provider:
 *  - the header trigger opens the command palette
 *  - the palette opens the add-link dialog
 */
export const COMMAND_PALETTE_EVENT = "milanverse:command-palette";
export const ADD_LINK_EVENT = "milanverse:add-link";

export function openCommandPalette(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COMMAND_PALETTE_EVENT));
}

export function requestAddLink(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADD_LINK_EVENT));
}
