import { isHostWorkspacePath } from "@/utils/hostConsole";

export function isCleanerWorkspacePath(pathname) {
  if (!pathname) return false;
  return pathname === "/cleaners" || pathname.startsWith("/cleaners/");
}

/** Routes that use a fullscreen layout without main nav chrome. */
export function isFullscreenRoute(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/ops")) return true;
  if (isHostWorkspacePath(pathname)) return true;
  if (isCleanerWorkspacePath(pathname)) return true;
  return pathname === "/login" || pathname === "/properties/add";
}
