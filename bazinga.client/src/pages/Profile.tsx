import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CreditCard,
  Laptop,
  LayoutDashboard,
  LogOut,
  Pencil,
  Save,
  ShieldCheck,
  Smartphone,
  UserCircle,
  Users,
} from "lucide-react";
// theme switching has been removed — dark is the only mode now
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ProfileAvatar from "@/components/ProfileAvatar";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SectionId = "overview" | "subscription" | "security" | "devices" | "profiles";

const Profile = () => {
  const { user, currentProfile, profiles, updateAccount, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const sections: { id: SectionId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: t("account.overview"), icon: LayoutDashboard },
    { id: "subscription", label: t("account.subscription"), icon: CreditCard },
    { id: "security", label: t("account.security"), icon: ShieldCheck },
    { id: "devices", label: t("account.devices"), icon: Laptop },
    { id: "profiles", label: t("account.profiles"), icon: Users },
  ];

  const initialSection = (searchParams.get("section") as SectionId) || "overview";
  const [section, setSection] = useState<SectionId>(initialSection);
  const [saving, setSaving] = useState(false);

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
    phone: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormState({
      username: user.username ?? "",
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
      phone: user.phone ?? "",
    });
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;

  const handleChange =
    (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateAccount({
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        dateOfBirth: formState.dateOfBirth || null,
        phone: formState.phone.trim(),
      });
      toast({ title: t("account.accountUpdated"), description: t("account.accountSaved") });
    } catch (err) {
      toast({
        title: t("account.couldNotSave"),
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const goHome = () => navigate("/");

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
          {t("account.backToBazinga")}
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
                className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {t("account.signOut")}
              </Button>
            </nav>
          </aside>

          {/* Content */}
          <section>
            {section === "overview" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">{t("account.title")}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t("account.memberSince", { date: user.createdAt?.slice(0, 10) ?? "—" })}
                  </p>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("account.role")}: {user.role ?? "USER"}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Link to="/profiles/manage">
                      <Button variant="outline" className="gap-2">
                        <Pencil className="h-4 w-4" />
                        {t("account.manageProfiles")}
                      </Button>
                    </Link>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h2 className="text-lg font-bold">{t("account.accountDetails")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="profile-username" label={t("account.username")} value={formState.username} onChange={() => undefined} disabled />
                    <Field id="profile-email" label={t("account.email")} type="email" value={formState.email} onChange={() => undefined} disabled />
                    <Field id="profile-first" label={t("account.firstName")} value={formState.firstName} onChange={handleChange("firstName")} />
                    <Field id="profile-last" label={t("account.lastName")} value={formState.lastName} onChange={handleChange("lastName")} />
                    <Field id="profile-dob" label={t("account.dateOfBirth")} type="date" value={formState.dateOfBirth} onChange={handleChange("dateOfBirth")} />
                    <Field id="profile-phone" label={t("account.phone")} type="tel" value={formState.phone} onChange={handleChange("phone")} placeholder="+1 555 123 4567" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("account.contactNote")}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" className="gap-2" disabled={saving}>
                      <Save className="h-4 w-4" />
                      {saving ? t("account.saving") : t("account.save")}
                    </Button>
                  </div>
                </form>

              </div>
            )}

            {section === "subscription" && (
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {t("account.subscriptionTitle")}
                </h1>
                <p className="text-sm text-muted-foreground">{t("account.planSubtitle")}</p>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary via-primary to-orange-500" />
                  <div className="p-6">
                    <h2 className="text-xl font-bold">
                      {user.subscriptionType && user.subscriptionType !== "Free"
                        ? `${user.subscriptionType} ${t("account.plan")}`
                        : t("account.freePlan")}
                    </h2>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link to="/bazinga-unlimited">
                        <Button variant="outline" className="gap-2">
                          <CreditCard className="h-4 w-4" />
                          {t("account.changePlan")}
                        </Button>
                      </Link>
                      {user.subscriptionExpiration && (
                        <span className="text-sm text-muted-foreground">
                          {t("account.renewsOn", { date: user.subscriptionExpiration })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === "security" && (
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {t("account.secTitle")}
                </h1>
                <p className="text-sm text-muted-foreground">{t("account.secSubtitle")}</p>

                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  <SecurityRow
                    icon={<ShieldCheck className="h-5 w-5" />}
                    label={t("account.password")}
                    value="••••••••"
                    action={
                      <Link to="/forgot-password">
                        <Button variant="outline" size="sm">
                          {t("account.changePassword")}
                        </Button>
                      </Link>
                    }
                  />
                  <SecurityRow icon={<UserCircle className="h-5 w-5" />} label={t("account.email")} value={user.email} />
                  <SecurityRow
                    icon={<Smartphone className="h-5 w-5" />}
                    label={t("account.phone")}
                    value={user.phone || t("account.notSet")}
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSection("overview")}
                      >
                        {user.phone ? t("account.update") : t("account.add")}
                      </Button>
                    }
                  />
                </div>

                <TwoFactorSetup />

                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-bold mb-2">{t("account.profilePins")}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t("account.profilePinsDesc")}</p>
                  <Link to="/profiles/manage">
                    <Button variant="outline" className="gap-2">
                      <Pencil className="h-4 w-4" />
                      {t("account.managePins")}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {section === "devices" && (
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {t("account.devicesTitle")}
                </h1>
                <p className="text-sm text-muted-foreground">{t("account.devicesSubtitle")}</p>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-4">
                    <Laptop className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-semibold">{t("account.thisBrowser")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("account.activeNow", { email: user.email })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("account.signOut")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {section === "profiles" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                      {t("account.profiles")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {t("account.profilesInUse", { count: profiles.length })}
                    </p>
                  </div>
                  <Link to="/profiles/manage">
                    <Button variant="outline" className="gap-2">
                      <Pencil className="h-4 w-4" />
                      {t("account.manageProfiles")}
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
                          {profile.isRoot ? t("header.mainProfile") : t("header.subProfile")}
                          {profile.isKids ? ` · ${t("header.kids")}` : ""}
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
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="grid gap-2">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled} />
  </div>
);

const SecurityRow = ({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center gap-4 p-4">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
    {action}
  </div>
);

export default Profile;
