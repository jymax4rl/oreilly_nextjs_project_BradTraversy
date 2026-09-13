import { isOpsStaff } from "@/utils/opsAuth";

/**
 * Online checkout (GeniusPay / Creem) is ops-only for now.
 *
 * Guests and hosts: WhatsApp number → request reservation → host sends a
 * payment link or payment instructions. No in-app MoMo/card checkout.
 *
 * Ops staff (admin / superadmin) can still run live payment rails for testing
 * and support on any listing.
 */

/**
 * @param {object | null | undefined} sessionOrUser - next-auth session, or user
 * @param {object | null | undefined} [_property] - listing being booked (unused;
 *   kept so call sites stay stable if we reopen partner allowlists later)
 * @returns {boolean}
 */
export function canUseOnlineCheckout(sessionOrUser, _property) {
  const user = sessionOrUser?.user ?? sessionOrUser;
  return Boolean(user && isOpsStaff(user.role));
}
