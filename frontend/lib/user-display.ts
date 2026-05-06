import type { AuthUser } from "@/lib/types";

export function getDisplayName(user: AuthUser | null) {
  return user?.name?.trim() || user?.email || "Account";
}

export function getFirstName(user: AuthUser | null) {
  const displayName = user?.name?.trim();
  if (!displayName) {
    return null;
  }

  return displayName.split(/\s+/)[0] || null;
}

export function getInitials(user: AuthUser | null) {
  const displayName = getDisplayName(user);
  const nameParts = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const parts = nameParts.length > 1 ? nameParts : displayName.split("@")[0].split(/[._-]+/);
  const initials = parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "A";
}
