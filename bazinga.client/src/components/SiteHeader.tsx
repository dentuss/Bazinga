import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Sparkles, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export type HeaderTone = "default" | "red" | "orange";

export type SiteHeaderNavItem = {
  label: string;
  to?: string;
  href?: string;
  tone?: HeaderTone;
  emphasize?: boolean;
};

export type SiteHeaderBrand = {
  layout: "stacked" | "inline";
  accentText: string;
  accentColor: "red" | "orange";
};

interface SiteHeaderProps {
  brand: SiteHeaderBrand;
  navItems: SiteHeaderNavItem[];
  homeLink?: string;
  avatarAccent?: "red" | "orange";
}

const toneClass = (tone?: HeaderTone) => {
  if (tone === "red") return "text-primary hover:text-primary/80";
  if (tone === "orange") return "text-orange-500 hover:text-orange-400";
  return "text-foreground/85 hover:text-foreground";
};

const SiteHeader = ({
  brand,
  navItems,
  homeLink = "/",
  avatarAccent = "red",
}: SiteHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const accentClass =
    brand.accentColor === "orange" ? "text-orange-500" : "text-primary";
  const avatarBorder =
    avatarAccent === "orange"
      ? "border-orange-500/40 ring-orange-500/30"
      : "border-primary/20 ring-primary/10";

  const renderBrand = () => {
    if (brand.layout === "inline") {
      return (
        <Link to={homeLink} className="flex items-baseline gap-1 shrink-0 leading-none">
          <span className="text-2xl font-black tracking-tighter text-primary">BAZINGA</span>
          <span className={`text-2xl font-black tracking-tighter ${accentClass}`}>
            {brand.accentText}
          </span>
        </Link>
      );
    }
    return (
      <Link to={homeLink} className="block leading-none shrink-0">
        <div className="text-2xl font-black tracking-tighter text-primary">BAZINGA</div>
        <div className={`text-[11px] font-black tracking-[0.45em] ${accentClass} mt-0.5`}>
          {brand.accentText}
        </div>
      </Link>
    );
  };

  const itemClass = (item: SiteHeaderNavItem, mobile = false) => {
    if (item.emphasize) {
      return mobile
        ? "block text-sm font-semibold px-4 py-3 rounded-md border border-orange-500/70 text-orange-500 text-center"
        : "ml-2 text-sm font-semibold px-4 py-1.5 rounded-md border border-orange-500/70 text-orange-500 hover:bg-orange-500 hover:text-black transition-colors";
    }
    const tone = toneClass(item.tone);
    return mobile
      ? `block w-full text-sm font-semibold px-3 py-3 rounded-md transition-colors hover:bg-muted ${tone}`
      : `text-sm font-semibold px-3 py-2 transition-colors ${tone}`;
  };

  const renderItem = (item: SiteHeaderNavItem, mobile = false) => {
    const cls = itemClass(item, mobile);
    const onClick = mobile ? () => setMobileOpen(false) : undefined;
    if (item.href) {
      return (
        <a key={item.label} href={item.href} onClick={onClick} className={cls}>
          {item.label}
        </a>
      );
    }
    return (
      <Link key={item.label} to={item.to ?? "#"} onClick={onClick} className={cls}>
        {item.label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-background via-background/85 to-transparent backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          {renderBrand()}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => renderItem(item))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" aria-label="Search" className="hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Link to="/bazinga-unlimited" className="hidden sm:block">
            <Button className="bg-gradient-to-r from-primary via-primary to-orange-500 hover:opacity-90 text-white font-bold uppercase tracking-wider shadow-lg shadow-[hsl(var(--shadow-glow))] border-0">
              <Sparkles className="h-4 w-4" />
              Join Now
            </Button>
          </Link>
          {user ? (
            <Link to="/profile" aria-label="View profile">
              <Avatar className={`h-9 w-9 border ring-1 ${avatarBorder}`}>
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={`${user.username} profile`} />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" className="hidden md:flex font-semibold">
                Sign In
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-screen min-h-[100dvh] w-[85%] max-w-xs bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="text-lg font-bold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.label}>{renderItem(item, true)}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/bazinga-unlimited");
                  }}
                  className="w-full bg-gradient-to-r from-primary via-primary to-orange-500 text-white font-bold uppercase tracking-wider border-0"
                >
                  <Sparkles className="h-4 w-4" />
                  Join Now
                </Button>
                {!user ? (
                  <>
                    <Link to="/auth?mode=signin" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth?mode=signup" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Register
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Profile
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
