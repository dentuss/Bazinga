import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User, X, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: "News", to: "/news", tone: "default" as const },
    { label: "Comics", to: "/comics", tone: "default" as const },
    { label: "Manga", to: "/under-construction", tone: "default" as const },
    { label: "Library", to: "/library", tone: "red" as const },
    { label: "TV", to: "/bazinga-tv", tone: "orange" as const },
  ];

  const toneClass = (tone: "default" | "red" | "orange") => {
    if (tone === "red") {
      return "text-primary hover:text-primary/80";
    }
    if (tone === "orange") {
      return "text-orange-500 hover:text-orange-400";
    }
    return "text-foreground/80 hover:text-foreground";
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-background via-background/85 to-transparent backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo: BAZINGA / COMICS stacked */}
        <Link to="/" className="block leading-none shrink-0">
          <div className="text-2xl md:text-3xl font-black tracking-tighter text-primary">
            BAZINGA
          </div>
          <div className="text-[11px] md:text-xs font-black tracking-[0.45em] text-primary mt-0.5">
            COMICS
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isTV = item.tone === "orange";
            return (
              <Link
                key={item.label}
                to={item.to}
                className={
                  isTV
                    ? "ml-2 text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-md border border-orange-500/70 text-orange-500 hover:bg-orange-500 hover:text-black transition-colors"
                    : `text-sm font-semibold uppercase tracking-wider px-4 py-2 transition-colors ${toneClass(item.tone)}`
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link to="/bazinga-unlimited" className="hidden sm:block">
            <Button
              className="bg-gradient-to-r from-primary via-primary to-orange-500 hover:from-primary/90 hover:via-primary/90 hover:to-orange-600 text-white font-bold uppercase tracking-wider shadow-lg shadow-[hsl(var(--shadow-glow))] border-0"
            >
              <Sparkles className="h-4 w-4" />
              Join Now
            </Button>
          </Link>

          {user ? (
            <Link to="/profile" aria-label="View profile">
              <Avatar className="h-9 w-9 border border-primary/20 ring-1 ring-primary/10 transition hover:ring-primary/30">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={`${user.username} profile`} /> : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" className="hidden md:flex font-semibold uppercase tracking-wider">
                Sign In
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-screen max-h-screen min-h-[100dvh] w-[85%] max-w-xs bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="text-lg font-bold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex w-full items-center rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wider transition-colors hover:bg-muted ${toneClass(item.tone)}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  className="w-full bg-gradient-to-r from-primary via-primary to-orange-500 text-white font-bold uppercase tracking-wider shadow-lg shadow-[hsl(var(--shadow-glow))] border-0"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/bazinga-unlimited");
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Join Now
                </Button>
                {!user ? (
                  <>
                    <Link to="/auth?mode=signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Register</Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Profile</Button>
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

export default Header;
