import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import News from "./pages/News";
import BazingaUnlimited from "./pages/BazingaUnlimited";
import SubscriptionCheckout from "./pages/SubscriptionCheckout";
import Library from "./pages/Library";
import ComicReader from "./pages/ComicReader";
import UnderConstruction from "./pages/UnderConstruction";
import Landing from "./pages/Landing";
import Choice from "./pages/Choice";
import BazingaTV from "./pages/BazingaTV";
import Watch from "./pages/Watch";

const queryClient = new QueryClient();

const RootGate = () => {
  const { user } = useAuth();
  return user ? <Choice /> : <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WishlistProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootGate />} />
              <Route path="/comics" element={<Index />} />
              <Route path="/bazinga-tv" element={<BazingaTV />} />
              <Route path="/bazinga-tv/watch/:id" element={<Watch />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/news" element={<News />} />
              <Route path="/bazinga-unlimited" element={<BazingaUnlimited />} />
              <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
              <Route path="/library" element={<Library />} />
              <Route path="/read/:id" element={<ComicReader />} />
              <Route path="/under-construction" element={<UnderConstruction />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WishlistProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
