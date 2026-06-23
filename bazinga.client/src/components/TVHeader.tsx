import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";

/** Shared BazingaTV navigation — used by the TV home, Anime, Series and My List. */
export const tvNavItems: SiteHeaderNavItem[] = [
  { label: "Home", labelKey: "header.home", to: "/bazinga-tv" },
  { label: "Series", labelKey: "header.series", to: "/bazinga-tv/series" },
  { label: "Anime", labelKey: "header.anime", to: "/bazinga-tv/anime" },
  { label: "My List", labelKey: "header.myList", to: "/bazinga-tv/my-list", tone: "orange" },
  { label: "Comics", labelKey: "header.comics", to: "/comics", tone: "red", emphasize: true },
];

const TVHeader = () => (
  <SiteHeader
    brand={{ layout: "inline", accentText: "TV", accentColor: "orange" }}
    navItems={tvNavItems}
    avatarAccent="orange"
    homeLink="/"
  />
);

export default TVHeader;
