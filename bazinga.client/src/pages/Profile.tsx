import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Laptop,
  LayoutDashboard,
  LogOut,
  Moon,
  Pencil,
  Save,
  ShieldCheck,
  Smartphone,
  Sun,
  UserCircle,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SectionId = "overview" | "subscription" | "security" | "devices" | "profiles";

const sections: { id: SectionId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "devices", label: "Devices", icon: Laptop },
  { id: "profiles", label: "Profiles", icon: Users },
];

const Profile = () => {
  const { user, currentProfile, profiles, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSection = (searchParams.get("section") as SectionId) || "overview";
  const [section, setSection] = useState<SectionId>(initialSection);

  useEffect(() => {
    if (searchParams.get("section") !== section) {
      const next = new URLSearchParams(searchParams);
      next.set("section", section);
      setSearchParams(next, { replace: true });
    }
  }, [section, searchParams, setSearchParams]);

  const [formState, setFormState] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    password: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormState({
      username: user.username ?? "",
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
      password: "",
    });
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;

  const handleChange =
    (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateUser({
      username: formState.username.trim(),
      email: formState.email.trim(),
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      dateOfBirth: formState.dateOfBirth,
    });
    setFormState((prev) => ({ ...prev, password: "" }));
    toast({ title: "Account updated", description: "Your account details have been saved." });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const goHome = () => navigate("/");
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
            BAZINGA
          </Link>
          {currentProfile && (
            <div className="flex items-center gap-2">
              <ProfileAvatar profile={currentProfile} size="xs" rounded="md" />
              <span className="text-sm font-semibold hidden sm:inline">{currentProfile.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-10">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bazinga
        </button>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside>
            <nav className="space-y-1 sticky top-6">
              {sections.map((s) => {
                const Icon = s.icon;
                const active = section === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                );
              })}
              <Separator className="my-3" />
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </nav>
          </aside>

          {/* Content */}
          <section>
            {section === "overview" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">Account</h1>
                  <p className="text-sm text-muted-foreground">Member since {user.createdAt?.slice(0, 10) ?? "—"}</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4">
                    {currentProfile ? (
                      <ProfileAvatar profile={currentProfile} size="lg" rounded="lg" />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-muted grid place-items-center">
                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-xl font-bold">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Role: {user.role ?? "USER"}</p>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Link to="/profiles/manage">
                      <Button variant="outline" className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Manage Profiles
                      </Button>
                    </Link>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h2 className="text-lg font-bold">Account details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="profile-username" label="Username" value={formState.username} onChange={handleChange("username")} required />
                    <Field id="profile-email" label="Email" type="email" value={formState.email} onChange={handleChange("email")} required />
                    <Field id="profile-first" label="First name" value={formState.firstName} onChange={handleChange("firstName")} />
                    <Field id="profile-last" label="Last name" value={formState.lastName} onChange={handleChange("lastName")} />
                    <Field id="profile-dob" label="Date of birth" type="date" value={formState.dateOfBirth} onChange={handleChange("dateOfBirth")} />
                    <Field id="profile-pass" label="New password" type="password" value={formState.password} onChange={handleChange("password")} placeholder="Leave blank to keep current" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save changes
                    </Button>
                  </div>
                </form>

                <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="h-5 w-5 text-orange-400" />
                    ) : (
                      <Sun className="h-5 w-5 text-orange-500" />
                    )}
                    <div>
                      <p className="font-semibold">Appearance</p>
                      <p className="text-sm text-muted-foreground">
                        Switch between day and night mode.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {isDark ? "Dark" : "Light"}
                    </span>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      aria-label="Toggle dark mode"
                    />
                  </div>
                </div>
              </div>
            )}

            {section === "subscription" && (
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Subscription</h1>
                <p className="text-sm text-muted-foreground">Plan and billing details.</p>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary via-primary to-orange-500" />
                  <div className="p-6">
                    <h2 className="text-xl font-bold">
                      {user.subscriptionType && user.subscriptionType !== "Free"
                        ? `${user.subscriptionType} Plan`
                        : "Free Plan"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      4K resolution, immersive audio, ad-free streaming and more.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link to="/bazinga-unlimited">
                        <Button variant="outline" className="gap-2">
                          <CreditCard className="h-4 w-4" />
                          Change plan
                        </Button>
                      </Link>
                      {user.subscriptionExpiration && (
                        <span className="text-sm text-muted-foreground">
                          Renews on {user.subscriptionExpiration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === "security" && (
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Security</h1>
                <p className="text-sm text-muted-foreground">Account credentials and access.</p>

                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  <SecurityRow icon={<ShieldCheck className="h-5 w-5" />} label="Password" value="••••••••" />
                  <SecurityRow icon={<UserCircle className="h-5 w-5" />} label="Email" value={user.email} />
                  <SecurityRow icon={<Smartphone className="h-5 w-5" />} label="Phone number" value="Not set" />
                </div>
              </div>
            )}

            {section === "devices" && (
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Devices</h1>
                <p className="text-sm text-muted-foreground">Manage where you are signed in.</p>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-4">
                    <Laptop className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-semibold">This browser</p>
                      <p className="text-sm text-muted-foreground">
                        Active now — signed in as {user.email}
                      </p>
                    </div>
                    <Button variant="ghost" onClick={handleLogout} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {section === "profiles" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">Profiles</h1>
                    <p className="text-sm text-muted-foreground">
                      {profiles.length} of 5 profiles in use.
                    </p>
                  </div>
                  <Link to="/profiles/manage">
                    <Button variant="outline" className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Manage Profiles
                    </Button>
                  </Link>
                </div>

                <ul className="rounded-xl border border-border bg-card divide-y divide-border">
                  {profiles.map((profile) => (
                    <li key={profile.id} className="flex items-center gap-4 p-4">
                      <ProfileAvatar profile={profile} size="md" rounded="lg" />
                      <div className="flex-1">
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.isRoot ? "Main profile" : "Sub-profile"}
                          {profile.isKids ? " · Kids" : ""}
                        </p>
                      </div>
                      <Link to={`/profiles/edit/${profile.id}`}>
                        <Button variant="ghost" size="icon" aria-label={`Edit ${profile.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const Field = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) => (
  <div className="grid gap-2">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} />
  </div>
);

const SecurityRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-4 p-4">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  </div>
);

export default Profile;
