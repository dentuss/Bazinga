import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";

const navItems: SiteHeaderNavItem[] = [
  { label: "News", to: "/news" },
  { label: "Comics", to: "/comics" },
  { label: "Manga", to: "/under-construction" },
  { label: "Library", to: "/library", tone: "red" },
  { label: "TV", to: "/bazinga-tv", tone: "orange", emphasize: true },
];

const Header = () => (
  <SiteHeader
    brand={{ layout: "stacked", accentText: "COMICS", accentColor: "red" }}
    navItems={navItems}
    avatarAccent="red"
  />
);

export default Header;
