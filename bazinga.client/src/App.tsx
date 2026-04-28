import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
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
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
