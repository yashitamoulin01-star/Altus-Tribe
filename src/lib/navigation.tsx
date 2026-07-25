import type { IconType } from "react-icons";
import {
  FiHome,
  FiUsers,
  FiShield,
  FiBookOpen,
  FiUser,
  FiUserPlus,
  FiCompass,
  FiRepeat,
  FiMessageCircle,
  FiZap,
  FiPlay,
  FiHelpCircle,
  FiExternalLink,
  FiHeart,
  FiCalendar,
  FiBell,
  FiSettings,
  FiAward,
  FiVolume2,
  FiGrid,
} from "react-icons/fi";
import { PS_APP_URL } from "@/lib/settings-meta";

// ── SINGLE SOURCE OF TRUTH FOR ALL NAVIGATION ───────────────────────────────
// Desktop top nav, ecosystem mega-menu, mobile bottom nav, and mobile "More"
// sheet ALL consume this file. Do not maintain parallel hardcoded arrays.
//
// ROUTE SAFETY: every href below is a REAL, existing route in this app. Where a
// spec label had no real page yet (Gatekeepers AI, Inspiration Corner, Elevator
// Pitches, Karma Bank, Gratitude Space) the item is marked `soon` and rendered
// as a disabled row — never a dead 404 link. When those features ship, flip
// `soon` off and point `href` at the new route here, in ONE place.

export type NavIcon = IconType;

export interface NavLink {
  label: string;
  href?: string;
  icon: NavIcon;
  description?: string;
  external?: boolean;
  soon?: boolean;
  /** Extra path prefixes that should render this destination as active. */
  match?: string[];
}

export interface NavSection {
  title: string;
  items: NavLink[];
}

/** LEVEL 1 — the five always-visible desktop destinations. */
export const primaryNavigation: NavLink[] = [
  { label: "Home", href: "/home", icon: FiHome, match: ["/home"] },
  { label: "Tribe", href: "/explore", icon: FiUsers, match: ["/explore", "/connections", "/messages", "/groups", "/m/"] },
  { label: "Sacred Space", href: "/sacred-space", icon: FiShield, match: ["/sacred-space"] },
  { label: "Campus", href: "/campus", icon: FiBookOpen, match: ["/campus"] },
  { label: "Profile", href: "/account", icon: FiUser, match: ["/account", "/settings", "/notifications"] },
];

/** LEVEL 2 — the full ecosystem, shown in the downward mega-menu / mobile sheet. */
export const ecosystemNavigation: NavSection[] = [
  {
    title: "Network",
    items: [
      { label: "Connect with Participants", href: "/explore", icon: FiCompass, description: "Discover valuable people in the Tribe" },
      { label: "Recommended Connections", href: "/explore", icon: FiUsers, description: "People you may benefit from meeting" },
      { label: "Gatekeepers AI", icon: FiZap, description: "Discover potential referral gatekeepers", soon: true },
      { label: "Referral Rounds", href: "/referral-rounds", icon: FiRepeat, description: "Wednesday networking & referrals" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Groups", href: "/groups", icon: FiUsers, description: "Cohort & interest groups" },
      { label: "Messages", href: "/messages", icon: FiMessageCircle, description: "1:1 and group chats" },
      { label: "Inspiration Corner", icon: FiZap, description: "Wins & inspiration from the Tribe", soon: true },
      { label: "Elevator Pitches", icon: FiPlay, description: "60-second member pitches", soon: true },
      { label: "Ask / Query", href: "/sacred-space", icon: FiHelpCircle, description: "Ask the Tribe or the team" },
    ],
  },
  {
    title: "Sacred Space",
    items: [
      { label: "Reach Manan Vasa / Team", href: "/sacred-space", icon: FiShield, description: "Direct line to the founder" },
      { label: "Announcements", href: "/sacred-space", icon: FiVolume2, description: "Updates from Manan Vasa" },
    ],
  },
  {
    title: "Ecosystem & Learning",
    items: [
      { label: "Productivity Shastra", href: PS_APP_URL, icon: FiExternalLink, description: "Open the PS app", external: true },
      { label: "Tribe Learning", href: "/campus", icon: FiBookOpen, description: "Sessions, replays & resources" },
      { label: "Refer Someone", href: "/refer", icon: FiUserPlus, description: "Invite someone to the Tribe" },
      { label: "Karma Bank", icon: FiHeart, description: "Give & receive in the Tribe", soon: true },
      { label: "Gratitude Space", icon: FiHeart, description: "Share appreciation", soon: true },
    ],
  },
  {
    title: "Events & Account",
    items: [
      { label: "Altus Conclave", href: "/campus", icon: FiCalendar, description: "The flagship gathering" },
      { label: "PS Orientation", href: "/campus", icon: FiAward, description: "Getting started in the ecosystem" },
      { label: "My Profile", href: "/account", icon: FiUser, description: "Your networking identity" },
      { label: "Notifications", href: "/notifications", icon: FiBell, description: "What needs your attention" },
      { label: "Settings", href: "/settings", icon: FiSettings, description: "Account & preferences" },
    ],
  },
];

/** MOBILE — persistent bottom bar. "More" opens the ecosystem sheet (no href). */
export const mobileBottomNav: NavLink[] = [
  { label: "Home", href: "/home", icon: FiHome, match: ["/home"] },
  { label: "Connect", href: "/explore", icon: FiCompass, match: ["/explore", "/connections", "/m/"] },
  { label: "Tribe", href: "/groups", icon: FiUsers, match: ["/groups", "/messages", "/tribe"] },
  { label: "Campus", href: "/campus", icon: FiBookOpen, match: ["/campus"] },
  { label: "More", icon: FiGrid, match: [] },
];

/** Active-state test shared by every nav surface. */
export function isActive(pathname: string, match: string[] | undefined): boolean {
  if (!match || match.length === 0) return false;
  return match.some((m) =>
    m.endsWith("/") ? pathname.startsWith(m) : pathname === m || pathname.startsWith(`${m}/`),
  );
}
