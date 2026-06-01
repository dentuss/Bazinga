import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
import ProfileSelector from "./pages/ProfileSelector";
import ManageProfiles from "./pages/ManageProfiles";
import ProfileEditor from "./pages/ProfileEditor";
import SignUpReview from "./pages/SignUpReview";
import SignUpCheckEmail from "./pages/SignUpCheckEmail";
import SignUpComplete from "./pages/SignUpComplete";

const queryClient = new QueryClient();

const RootGate = () => {
  const { user, currentProfile } = useAuth();
  if (!user) return <Landing />;
  if (!currentProfile) return <Navigate to="/profiles" replace />;
  return <Choice />;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const RequireProfile = ({ children }: { children: React.ReactNode }) => {
  const { user, currentProfile } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (!currentProfile) return <Navigate to="/profiles" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<RootGate />} />
                <Route path="/auth" element={<Auth />} />

                <Route path="/signup/review" element={<SignUpReview />} />
                <Route path="/signup/check-email" element={<SignUpCheckEmail />} />
                <Route path="/signup/complete" element={<SignUpComplete />} />

                <Route
                  path="/profiles"
                  element={
                    <RequireAuth>
                      <ProfileSelector />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profiles/manage"
                  element={
                    <RequireAuth>
                      <ManageProfiles />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profiles/new"
                  element={
                    <RequireAuth>
                      <ProfileEditor />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profiles/edit/:id"
                  element={
                    <RequireAuth>
                      <ProfileEditor />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/comics"
                  element={
                    <RequireProfile>
                      <Index />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/bazinga-tv"
                  element={
                    <RequireProfile>
                      <BazingaTV />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/bazinga-tv/watch/:id"
                  element={
                    <RequireProfile>
                      <Watch />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/library"
                  element={
                    <RequireProfile>
                      <Library />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <RequireProfile>
                      <Wishlist />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/read/:id"
                  element={
                    <RequireProfile>
                      <ComicReader />
                    </RequireProfile>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/subscription-checkout"
                  element={
                    <RequireAuth>
                      <SubscriptionCheckout />
                    </RequireAuth>
                  }
                />

                <Route path="/admin" element={<Admin />} />
                <Route path="/news" element={<News />} />
                <Route path="/bazinga-unlimited" element={<BazingaUnlimited />} />
                <Route path="/under-construction" element={<UnderConstruction />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
