import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CollectionsProvider } from "@/contexts/CollectionsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SigninVerify from "./pages/SigninVerify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import AllAnime from "./pages/AllAnime";
import Series from "./pages/Series";
import MyList from "./pages/MyList";
import Watch from "./pages/Watch";
import ProfileSelector from "./pages/ProfileSelector";
import ManageProfiles from "./pages/ManageProfiles";
import ProfileEditor from "./pages/ProfileEditor";
import SignUpReview from "./pages/SignUpReview";
import SignUpCheckEmail from "./pages/SignUpCheckEmail";
import SignUpComplete from "./pages/SignUpComplete";
import Characters from "./pages/Characters";
import AllComics from "./pages/AllComics";
import AllManga from "./pages/AllManga";
import AboutBazinga from "./pages/AboutBazinga";
import Faqs from "./pages/Faqs";
import Careers from "./pages/Careers";
import Internships from "./pages/Internships";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

/** True when the user landed with a stored profile id but the fetch hasn't returned yet. */
const usingStoredProfile = (profiles: { id: number }[], profilesLoading: boolean) => {
  if (profiles.length > 0) return false;
  if (!profilesLoading) return false;
  return Boolean(sessionStorage.getItem("current_profile_id"));
};

const ProfilesLoading = () => (
  <div className="min-h-screen bg-background grid place-items-center text-muted-foreground text-sm">
    Loading your profile…
  </div>
);

const RootGate = () => {
  const { user, currentProfile, trialExpired, profiles, profilesLoading } = useAuth();
  if (!user) return <Landing />;
  if (!currentProfile) {
    if (usingStoredProfile(profiles, profilesLoading)) return <ProfilesLoading />;
    return <Navigate to="/profiles" replace />;
  }
  if (trialExpired) return <Navigate to="/bazinga-unlimited?from=trial-expired" replace />;
  return <Choice />;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const RequireProfile = ({ children }: { children: React.ReactNode }) => {
  const { user, currentProfile, trialExpired, profiles, profilesLoading } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (!currentProfile) {
    // Browser reload or deep-link: AuthProvider has the session token but
    // profiles are still loading. Don't bounce to /profiles until we know.
    if (usingStoredProfile(profiles, profilesLoading)) return <ProfilesLoading />;
    return <Navigate to="/profiles" replace />;
  }
  if (trialExpired) return <Navigate to="/bazinga-unlimited?from=trial-expired" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <CollectionsProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<RootGate />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signin/verify" element={<SigninVerify />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

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
                  path="/characters"
                  element={
                    <RequireProfile>
                      <Characters />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/comics/all"
                  element={
                    <RequireProfile>
                      <AllComics />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/manga"
                  element={
                    <RequireProfile>
                      <AllManga />
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
                  path="/bazinga-tv/anime"
                  element={
                    <RequireProfile>
                      <AllAnime />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/bazinga-tv/series"
                  element={
                    <RequireProfile>
                      <Series />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/bazinga-tv/my-list"
                  element={
                    <RequireProfile>
                      <MyList />
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
                <Route path="/about-bazinga" element={<AboutBazinga />} />
                <Route path="/faqs" element={<Faqs />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/internships" element={<Internships />} />
                <Route path="/bazinga-unlimited" element={<BazingaUnlimited />} />
                <Route path="/under-construction" element={<UnderConstruction />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
        </CollectionsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
