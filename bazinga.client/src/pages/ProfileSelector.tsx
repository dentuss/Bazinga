import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Lock, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar";
import PinEntryModal from "@/components/PinEntryModal";
import { useAuth } from "@/contexts/AuthContext";
import { MAX_PROFILES_PER_ACCOUNT, verifyProfilePin, type Profile } from "@/lib/profiles";

const ProfileSelector = () => {
  const navigate = useNavigate();
  const { user, profiles, profilesLoading, selectProfile, logout, token } = useAuth();
  const [pinFor, setPinFor] = useState<Profile | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  // The AuthProvider already kicks off the profile fetch as soon as the token
  // shows up — re-triggering it here was double-firing the call in StrictMode
  // and racing the auto-create of the root profile (two roots got inserted).

  if (!user) return <Navigate to="/auth" replace />;

  const canAdd = profiles.length < MAX_PROFILES_PER_ACCOUNT;

  const handlePick = (profile: Profile) => {
    if (profile.hasPin) {
      setPinError(null);
      setPinFor(profile);
      return;
    }
    selectProfile(profile.id);
    navigate("/", { replace: true });
  };

  const handlePinSubmit = async (pin: string) => {
    if (!pinFor || !token) return;
    setPinBusy(true);
    setPinError(null);
    try {
      await verifyProfilePin(token, pinFor.id, pin);
      const id = pinFor.id;
      setPinFor(null);
      selectProfile(id);
      navigate("/", { replace: true });
    } catch (err) {
      setPinError(err instanceof Error && err.message ? err.message : "Incorrect PIN.");
    } finally {
      setPinBusy(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-5">
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
          BAZINGA
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Who's watching?</h1>
          <p className="mt-3 text-muted-foreground">
            Pick a profile to continue into the Bazinga universe.
          </p>

          {profilesLoading && profiles.length === 0 ? (
            <p className="mt-16 text-sm text-muted-foreground">Loading your profiles…</p>
          ) : (
            <div className="mt-14 flex flex-wrap items-start justify-center gap-6 md:gap-10">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handlePick(profile)}
                  className="group flex flex-col items-center gap-3 outline-none"
                  aria-label={`Continue as ${profile.name}`}
                >
                  <div className="relative">
                    <ProfileAvatar
                      profile={profile}
                      size="xl"
                      rounded="lg"
                      className="ring-2 ring-transparent transition-all duration-200 group-hover:ring-primary group-hover:scale-105 group-focus-visible:ring-primary"
                    />
                    {profile.isRoot && (
                      <span className="absolute -top-2 -right-2 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider px-2 py-0.5 shadow">
                        Main
                      </span>
                    )}
                    {profile.isKids && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 shadow">
                        Kids
                      </span>
                    )}
                    {profile.hasPin && (
                      <span
                        className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-black/80 grid place-items-center border border-primary/60 shadow"
                        aria-label="PIN protected"
                        title="PIN protected"
                      >
                        <Lock className="h-3.5 w-3.5 text-primary" />
                      </span>
                    )}
                  </div>
                  <span className="text-base md:text-lg text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
                    {profile.name}
                  </span>
                </button>
              ))}

              {canAdd && (
                <Link
                  to="/profiles/manage?new=1"
                  className="group flex flex-col items-center gap-3 outline-none"
                  aria-label="Add a new profile"
                >
                  <div className="h-28 w-28 md:h-32 md:w-32 rounded-xl border-2 border-dashed border-muted-foreground/60 grid place-items-center text-muted-foreground transition-all duration-200 group-hover:border-foreground group-hover:text-foreground group-hover:scale-105">
                    <Plus className="h-12 w-12" strokeWidth={1.5} />
                  </div>
                  <span className="text-base md:text-lg text-muted-foreground group-hover:text-foreground">
                    Add Profile
                  </span>
                </Link>
              )}
            </div>
          )}

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            <Link to="/profiles/manage">
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                Manage Profiles
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </main>

      <PinEntryModal
        open={pinFor !== null}
        title={pinFor ? `${pinFor.name}'s PIN` : "Enter PIN"}
        description="This profile is locked. Enter the 4-digit PIN to continue."
        busy={pinBusy}
        error={pinError}
        onSubmit={handlePinSubmit}
        onClose={() => {
          setPinFor(null);
          setPinError(null);
        }}
      />
    </div>
  );
};

export default ProfileSelector;
