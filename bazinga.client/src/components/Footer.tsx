import { Facebook, Twitter, Instagram, Youtube, Twitch } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  const links = [
    { label: t("footer.aboutBazinga"), href: "/about-bazinga" },
    { label: t("footer.helpFaqs"), href: "/faqs" },
    { label: t("footer.careers"), href: "/careers" },
    { label: t("footer.internships"), href: "/internships" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "/under-construction", label: "Facebook" },
    { icon: Twitter, href: "/under-construction", label: "Twitter" },
    { icon: Instagram, href: "/under-construction", label: "Instagram" },
    { icon: Youtube, href: "/under-construction", label: "YouTube" },
    { icon: Twitch, href: "/under-construction", label: "Twitch" },
  ];

  const legalLinks = [
    { label: t("footer.terms"), href: "/under-construction" },
    { label: t("footer.privacy"), href: "/under-construction" },
    { label: t("footer.cookie"), href: "/under-construction" },
    { label: t("footer.license"), href: "/under-construction" },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="text-4xl font-black text-primary">BAZINGA</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">{t("footer.tagline")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-bold mb-4">{t("footer.follow")}</h3>
          <div className="flex gap-3">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                to={social.href}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-primary/40"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">©2026 BAZINGA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
