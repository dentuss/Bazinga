import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * On any in-app route change, scroll the window back to the top. Browsers
 * preserve scroll across SPA navigations by default — for a content-heavy
 * shelf that's almost always wrong.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
};

export default ScrollToTop;
