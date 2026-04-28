import { useState } from "react";
import { Search, User, Menu, ShoppingCart, Heart, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const { totalItems } = useCart();
  const { totalItems: wishlistItems } = useWishlist();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const comicsSubmenu = [
    { label: "Digital Read", action: "digital" },
    { label: "Bazinga Unlimited", href: "/bazinga-unlimited" },
    { label: "Stormbreakers", anchor: "#stormbreakers" },
    { label: "Reading Guides", anchor: "#reading-guides" },
    { label: "All Comics", action: "all" },
  ];
  const charactersSubmenu = ["Browse All", "Teams", "Avengers", "X-Men", "Guardians"];
  const moviesSubmenu = ["Latest Releases", "Upcoming", "Box Office", "News"];
  const tvShowsSubmenu = ["Streaming Now", "Upcoming Series", "Episode Guides"];
  const gamesSubmenu = ["Video Games", "Mobile Games", "Board Games"];
  const mobileNavItems = [
    { label: "NEWS", to: "/news" },
    { label: "COMICS", to: "/?view=all" },
    { label: "CHARACTERS", to: "/#characters" },
    { label: "MOVIES", to: "/#movies" },
    { label: "TV SHOWS", to: "/#tv-shows" },
    { label: "GAMES", to: "/#games" },
    { label: "YOUR LIBRARY", to: "/library" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleComicsView = (view: "all" | "digital") => {
    navigate(`/?view=${view}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary hover:text-primary/90 transition-colors">
              BAZINGA
            </Link>
            
            {/* Desktop Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="gap-0">
                <NavigationMenuItem>
                  <Link to="/news" className="text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors px-4 py-2">
                    NEWS
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold bg-transparent hover:bg-accent">
                    COMICS
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] bg-white text-black p-2 shadow-lg border border-gray-200">
                      {comicsSubmenu.map((item) => (
                        item.action ? (
                          <button
                            key={item.label}
                            onClick={() => handleComicsView(item.action)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-sm transition-colors"
                          >
                            {item.label}
                          </button>
                        ) : item.href ? (
                          <Link
                            key={item.label}
                            to={item.href}
                            className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-sm transition-colors"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <a
                            key={item.label}
                            href={item.anchor}
                            className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-sm transition-colors"
                          >
                            {item.label}
                          </a>
                        )
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold bg-transparent hover:bg-accent">
                    CHARACTERS
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] bg-white text-black p-2 shadow-lg border border-gray-200">
                      {charactersSubmenu.map((item) => (
                        <a
                          key={item}
                          href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-sm transition-colors"
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold bg-transparent hover:bg-accent">
                    MOVIES
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] bg-white text-black p-2 shadow-lg border border-gray-200">
                      {moviesSubmenu.map((item) => (
                        <a
                          key={item}
                          href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-sm transition-colors"
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold bg-transparent hover:bg-accent">
                    TV SHOWS
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] bg-white text-black p-2 shadow-lg border border-gray-200">
                      {tvShowsSubmenu.map((item) => (
                        <a
                          key={item}
                          href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-sm transition-colors"
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold bg-transparent hover:bg-accent">
                    GAMES
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] bg-white text-black p-2 shadow-lg border border-gray-200">
                      {gamesSubmenu.map((item) => (
                        <a
                          key={item}
                          href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-sm transition-colors"
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/library" className="px-4 py-2">
                    <Button className="h-8 px-4 bg-orange-600 text-white hover:bg-orange-700">
                      YOUR LIBRARY
                    </Button>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search comics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 md:w-64 bg-muted"
                  autoFocus
                />
                <Button type="submit" variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <X className="h-5 w-5" />
                </Button>
              </form>
            ) : (
              <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            )}
            {user?.role === "ADMIN" && (
              <Link to="/admin" className="hidden md:flex">
                <Button variant="outline" className="text-xs font-semibold tracking-wide">
                  ADMIN
                </Button>
              </Link>
            )}
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistItems}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
            {user ? (
              <Link to="/profile" className="flex items-center" aria-label="View profile">
                <Avatar className="h-9 w-9 border border-primary/20 ring-1 ring-primary/10 transition hover:ring-primary/30">
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
                <Button variant="default" className="hidden md:flex">
                  <User className="h-4 w-4 mr-2" />
                  SIGN IN
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
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-screen max-h-screen min-h-[100dvh] w-[85%] max-w-xs bg-background shadow-xl flex flex-col min-h-0">
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
            <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
              <ul className="space-y-2">
                {mobileNavItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {!user ? (
                <div className="mt-6 flex flex-col gap-3">
                  <Link to="/auth?mode=signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Register</Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-3">
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Profile</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
