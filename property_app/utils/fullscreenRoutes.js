import { isHostWorkspacePath } from "@/utils/hostConsole";

/** Routes that use a fullscreen layout without main nav chrome. */
export function isFullscreenRoute(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/ops")) return true;
  if (isHostWorkspacePath(pathname)) return true;
  return pathname === "/login" || pathname === "/properties/add";
}
