import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formState, setFormState] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormState({
      username: user.username ?? "",
      email: user.email ?? "",
      password: "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
    });
  }, [user]);

  const initials = useMemo(() => {
    if (!user) return "U";
    const label = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    if (label) return label.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    return user.username?.slice(0, 2).toUpperCase() ?? "U";
  }, [user]);

  const handleChange = (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
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
    toast({
      title: "Profile updated",
      description: "Your profile details have been saved.",
    });
  };

  const handleReset = () => {
    if (!user) return;
    setFormState({
      username: user.username ?? "",
      email: user.email ?? "",
      password: "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border py-4">
          <div className="container mx-auto px-4">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary hover:text-primary/90 transition-colors">
              BAZINGA
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Sign in to view and update your profile details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Link to="/auth">
                <Button className="w-full">Go to Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter text-primary hover:text-primary/90 transition-colors">
            BAZINGA
          </Link>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Profile overview</CardTitle>
              <CardDescription>Update your personal details and account information.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-primary/20">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={`${user.username} avatar`} /> : null}
                  <AvatarFallback className="bg-muted text-muted-foreground text-lg font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Role: {user.role ?? "USER"}</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
                  <p className="text-base text-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Subscription type</p>
                  <p className="text-base text-foreground">{user.subscriptionType ?? "Free"}</p>
                  {user.subscriptionExpiration ? (
                    <p className="text-xs text-muted-foreground mt-1">Renews on {user.subscriptionExpiration}</p>
                  ) : null}
                </div>
              </div>
              <Button variant="outline" onClick={handleReset}>
                Reset changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>Keep your Bazinga profile up to date.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="profile-username">Username</Label>
                    <Input
                      id="profile-username"
                      value={formState.username}
                      onChange={handleChange("username")}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange("email")}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-first-name">First name</Label>
                    <Input
                      id="profile-first-name"
                      value={formState.firstName}
                      onChange={handleChange("firstName")}
                      placeholder="First name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-last-name">Last name</Label>
                    <Input
                      id="profile-last-name"
                      value={formState.lastName}
                      onChange={handleChange("lastName")}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-dob">Date of birth</Label>
                    <Input
                      id="profile-dob"
                      type="date"
                      value={formState.dateOfBirth}
                      onChange={handleChange("dateOfBirth")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-password">Password</Label>
                    <Input
                      id="profile-password"
                      type="password"
                      value={formState.password}
                      onChange={handleChange("password")}
                      placeholder="Update password"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" className="gap-2">
                    <Save className="h-4 w-4" />
                    Save changes
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
