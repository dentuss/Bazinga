import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  MAX_PROFILES_PER_ACCOUNT,
  PROFILE_ICONS,
  PROFILE_PALETTE,
} from "@/lib/profiles";
import { cn } from "@/lib/utils";

const ProfileEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = useParams();
  const {
    user,
    profiles,
    currentProfile,
    createProfile,
    saveProfile,
    removeProfile,
  } = useAuth();

  const isCreate = !params.id;
  const editingId = isCreate ? null : Number(params.id);
  const existing = useMemo(
    () => (editingId !== null ? profiles.find((p) => p.id === editingId) ?? null : null),
    [editingId, profiles]
  );

  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(PROFILE_PALETTE[0]);
  const [avatarIcon, setAvatarIcon] = useState<string | null>(PROFILE_ICONS[0]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setAvatarColor(existing.avatarColor || PROFILE_PALETTE[0]);
      setAvatarIcon(existing.avatarIcon || null);
      setAvatarUrl(existing.avatarUrl || "");
      setIsKids(existing.isKids);
    }
  }, [existing]);

  if (!user) return <Navigate to="/auth" replace />;

  const canManageAll = !currentProfile || currentProfile.isRoot;
  const canEditThis = isCreate ? canManageAll : canManageAll || currentProfile?.id === editingId;
  const atLimit = isCreate && profiles.length >= MAX_PROFILES_PER_ACCOUNT;

  if (!isCreate && !existing && profiles.length > 0) {
    return <Navigate to="/profiles/manage" replace />;
  }
  if (!canEditThis) {
    return <Navigate to="/profiles" replace />;
  }
  if (atLimit) {
    return <Navigate to="/profiles/manage" replace />;
  }

  const previewProfile = {
    name: name || (isCreate ? "New Profile" : existing?.name || ""),
    avatarUrl: avatarUrl || null,
    avatarColor,
    avatarIcon,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        avatarColor,
        avatarIcon: avatarUrl ? null : avatarIcon,
        avatarUrl: avatarUrl.trim() || null,
        isKids,
      };
      if (isCreate) {
        await createProfile(payload);
        toast({ title: "Profile created", description: `${payload.name} is ready to watch.` });
      } else if (editingId !== null) {
        await saveProfile(editingId, payload);
        toast({ title: "Profile saved", description: "Your changes have been stored." });
      }
      navigate("/profiles/manage");
    } catch (err) {
      toast({
        title: isCreate ? "Could not create profile" : "Could not save profile",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      await removeProfile(existing.id);
      toast({ title: "Profile removed", description: `${existing.name} has been deleted.` });
      navigate("/profiles/manage");
    } catch (err) {
      toast({
        title: "Could not remove profile",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const showDelete = !isCreate && existing && !existing.isRoot && canManageAll;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
          BAZINGA
        </Link>
        <Button
          variant="ghost"
          onClick={() => navigate("/profiles/manage")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profiles
        </Button>
      </header>

      <main className="container mx-auto px-4 md:px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            {isCreate ? "Add Profile" : "Edit Profile"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isCreate
              ? "Create a new face for someone else to watch as."
              : "Update name, look, and parental settings."}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 grid gap-8 md:grid-cols-[200px_1fr]">
            {/* Preview avatar */}
            <div className="flex flex-col items-center gap-3">
              <ProfileAvatar profile={previewProfile} size="xl" rounded="lg" />
              <p className="text-sm text-muted-foreground text-center max-w-[180px] truncate">
                {previewProfile.name}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="profile-name">Display name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your nickname"
                  maxLength={100}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label>Avatar color</Label>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      className={cn(
                        "h-9 w-9 rounded-md ring-2 ring-offset-2 ring-offset-background transition-all",
                        avatarColor === color
                          ? "ring-foreground scale-110"
                          : "ring-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Use color ${color}`}
                    >
                      {avatarColor === color && (
                        <Check className="h-4 w-4 mx-auto text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Avatar icon</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarIcon(null)}
                    className={cn(
                      "h-9 px-3 rounded-md border text-xs font-semibold transition-colors",
                      avatarIcon === null
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-muted hover:bg-muted/80"
                    )}
                  >
                    Use initial
                  </button>
                  {PROFILE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setAvatarIcon(icon)}
                      className={cn(
                        "h-9 w-9 rounded-md border text-lg leading-none flex items-center justify-center transition-colors",
                        avatarIcon === icon
                          ? "border-foreground bg-foreground/10"
                          : "border-border bg-muted hover:bg-muted/80"
                      )}
                      aria-label={`Use icon ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-avatar-url">Avatar image URL (optional)</Label>
                <Input
                  id="profile-avatar-url"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://…"
                />
                <p className="text-xs text-muted-foreground">
                  Overrides color and icon when set.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-semibold">Kids profile</p>
                  <p className="text-sm text-muted-foreground">
                    Restrict to age-appropriate content only.
                  </p>
                </div>
                <Switch checked={isKids} onCheckedChange={setIsKids} />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {submitting
                    ? isCreate
                      ? "Creating…"
                      : "Saving…"
                    : isCreate
                      ? "Create profile"
                      : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profiles/manage")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                {showDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDeleteOpen(true)}
                    disabled={submitting}
                    className="ml-auto text-destructive hover:text-destructive gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete profile
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {existing
                ? `${existing.name}'s viewing history, list, and recommendations will be permanently removed.`
                : "This profile will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileEditor;
