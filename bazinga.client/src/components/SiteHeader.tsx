import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MasterSearch from "@/components/MasterSearch";
import {
  Check,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { MAX_PROFILES_PER_ACCOUNT } from "@/lib/profiles";

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
  const { user, profiles, currentProfile, hasPaidSubscription, selectProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K opens the master search anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const accentClass =
    brand.accentColor === "orange" ? "text-orange-500" : "text-primary";
  const avatarBorder =
    avatarAccent === "orange"
      ? "border-orange-500/40 ring-orange-500/30"
      : "border-primary/20 ring-primary/10";

  const canManage = !currentProfile || currentProfile.isRoot;
  const canAdd = canManage && profiles.length < MAX_PROFILES_PER_ACCOUNT;
  const isDark = theme === "dark";
  const otherProfiles = profiles.filter((p) => p.id !== currentProfile?.id);

  const handleSwitchProfile = (id: number) => {
    selectProfile(id);
    navigate("/");
  };

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

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

  const renderAvatar = () => {
    if (currentProfile) {
      return (
        <ProfileAvatar
          profile={currentProfile}
          size="sm"
          rounded="md"
          className={`ring-1 ${avatarBorder} border`}
        />
      );
    }
    return (
      <Avatar className={`h-9 w-9 border ring-1 ${avatarBorder}`}>
        {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={`${user.username} profile`} /> : null}
        <AvatarFallback className="bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="hidden sm:flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          {!hasPaidSubscription && (
            <Link to="/bazinga-unlimited" className="hidden sm:block">
              <Button className="bg-gradient-to-r from-primary via-primary to-orange-500 hover:opacity-90 text-white font-bold uppercase tracking-wider shadow-lg shadow-[hsl(var(--shadow-glow))] border-0">
                <Sparkles className="h-4 w-4" />
                Join Now
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Account and profiles menu"
              >
                {renderAvatar()}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-72 p-2 border-border/70 shadow-xl"
              >
                <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2">
                  {currentProfile ? (
                    <ProfileAvatar profile={currentProfile} size="sm" rounded="md" />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-muted grid place-items-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {currentProfile?.name ?? user.username}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>

                {otherProfiles.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-1 py-1 max-h-64 overflow-y-auto">
                      {otherProfiles.map((profile) => (
                        <DropdownMenuItem
                          key={profile.id}
                          onSelect={() => handleSwitchProfile(profile.id)}
                          className="gap-3 cursor-pointer py-2"
                        >
                          <ProfileAvatar profile={profile} size="sm" rounded="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{profile.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {profile.isRoot ? "Main profile" : profile.isKids ? "Kids" : "Sub-profile"}
                            </p>
                          </div>
                          {profile.id === currentProfile?.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </>
                )}

                {canAdd && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => navigate("/profiles/new")}
                      className="gap-3 cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-md border border-dashed border-muted-foreground/60 grid place-items-center text-muted-foreground">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">Add Profile</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                {canManage && (
                  <DropdownMenuItem
                    onSelect={() => navigate("/profiles/manage")}
                    className="gap-3 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Manage Profiles</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => navigate("/profiles")}
                  className="gap-3 cursor-pointer"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Switch Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/profile")}
                  className="gap-3 cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleTheme();
                  }}
                  className="gap-3 cursor-pointer"
                >
                  {isDark ? (
                    <Moon className="h-4 w-4 text-orange-400" />
                  ) : (
                    <Sun className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm flex-1">Theme</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {isDark ? "Dark" : "Light"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/under-construction")}
                  className="gap-3 cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Help center</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  className="gap-3 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign out of Bazinga</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                {!hasPaidSubscription && (
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
                )}
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/profiles");
                      }}
                    >
                      <Users className="h-4 w-4" />
                      Switch Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/profile");
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Account
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={() => {
                        setMobileOpen(false);
                        toggleTheme();
                      }}
                    >
                      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      {isDark ? "Switch to light mode" : "Switch to dark mode"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full gap-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        setMobileOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth?mode=signin" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
      <MasterSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default SiteHeader;
