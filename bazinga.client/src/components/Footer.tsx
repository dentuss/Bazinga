import { Facebook, Twitter, Instagram, Youtube, Twitch } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const links = [
    { label: "ABOUT BAZINGA", href: "/under-construction" },
    { label: "HELP/FAQS", href: "/under-construction" },
    { label: "CAREERS", href: "/under-construction" },
    { label: "INTERNSHIPS", href: "/under-construction" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "/under-construction", label: "Facebook" },
    { icon: Twitter, href: "/under-construction", label: "Twitter" },
    { icon: Instagram, href: "/under-construction", label: "Instagram" },
    { icon: Youtube, href: "/under-construction", label: "YouTube" },
    { icon: Twitch, href: "/under-construction", label: "Twitch" },
  ];

  const legalLinks = [
    "Terms of Use",
    "Privacy Policy",
    "Interest-Based Ads",
    "License Agreement",
    "Cookie Policy",
    "Your US State Privacy Rights",
    "©2025 BAZINGA",
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-4xl font-black text-primary">BAZINGA</div>
        </div>

        {/* Main Links */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          <div className="space-y-3">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="block text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-4">FOLLOW BAZINGA</h3>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                to={social.href}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Legal Links */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {legalLinks.map((link, index) => (
              <span key={index}>
                {index < legalLinks.length - 1 ? (
                  <Link to="/under-construction" className="hover:text-foreground transition-colors">
                    {link}
                  </Link>
                ) : (
                  <span>{link}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
