import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";

const navItems: SiteHeaderNavItem[] = [
  { label: "News", labelKey: "header.news", to: "/news" },
  { label: "Comics", labelKey: "header.comics", to: "/comics/all" },
  { label: "Characters", labelKey: "header.characters", to: "/characters" },
  { label: "Manga", labelKey: "header.manga", to: "/manga" },
  { label: "Library", labelKey: "header.library", to: "/library", tone: "red" },
  { label: "TV", labelKey: "header.tv", to: "/bazinga-tv", tone: "orange", emphasize: true },
];

const Header = () => (
  <SiteHeader
    brand={{ layout: "stacked", accentText: "COMICS", accentColor: "red" }}
    navItems={navItems}
    avatarAccent="red"
    homeLink="/"
  />
);

export default Header;
