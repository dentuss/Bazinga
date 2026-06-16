import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";

/** Shared BazingaTV navigation — used by the TV home, Anime, Series and My List. */
export const tvNavItems: SiteHeaderNavItem[] = [
  { label: "Home", to: "/bazinga-tv" },
  { label: "Series", to: "/bazinga-tv/series" },
  { label: "Anime", to: "/bazinga-tv/anime" },
  { label: "My List", to: "/bazinga-tv/my-list", tone: "orange" },
  { label: "Comics", to: "/comics", tone: "red", emphasize: true },
];

const TVHeader = () => (
  <SiteHeader
    brand={{ layout: "inline", accentText: "TV", accentColor: "orange" }}
    navItems={tvNavItems}
    avatarAccent="orange"
  />
);

export default TVHeader;
