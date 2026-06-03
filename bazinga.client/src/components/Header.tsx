import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";

const navItems: SiteHeaderNavItem[] = [
  { label: "News", to: "/news" },
  { label: "Comics", to: "/comics/all" },
  { label: "Characters", to: "/characters" },
  { label: "Manga", to: "/manga" },
  { label: "Library", to: "/library", tone: "red" },
  { label: "TV", to: "/bazinga-tv", tone: "orange", emphasize: true },
];

const Header = () => (
  <SiteHeader
    brand={{ layout: "stacked", accentText: "COMICS", accentColor: "red" }}
    navItems={navItems}
    avatarAccent="red"
    homeLink="/comics"
  />
);

export default Header;
