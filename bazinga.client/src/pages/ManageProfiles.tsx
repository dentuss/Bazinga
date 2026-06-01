import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { MAX_PROFILES_PER_ACCOUNT, type Profile } from "@/lib/profiles";

const ManageProfiles = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, profiles, currentProfile, removeProfile, refreshProfiles } = useAuth();
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) void refreshProfiles();
  }, [user, refreshProfiles]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
      navigate("/profiles/new");
    }
  }, [searchParams, setSearchParams, navigate]);

  if (!user) return <Navigate to="/auth" replace />;

  // Only the root profile (or the not-yet-selected initial state) may add/delete.
  const canManageAll = !currentProfile || currentProfile.isRoot;
  const canAdd = canManageAll && profiles.length < MAX_PROFILES_PER_ACCOUNT;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeProfile(pendingDelete.id);
      toast({ title: "Profile removed", description: `${pendingDelete.name} has been deleted.` });
      setPendingDelete(null);
    } catch (err) {
      toast({
        title: "Could not remove profile",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
          BAZINGA
        </Link>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </header>

      <main className="container mx-auto px-4 md:px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Manage Profiles</h1>
            <p className="mt-2 text-muted-foreground">
              Up to {MAX_PROFILES_PER_ACCOUNT} profiles per account. Each profile keeps its own
              taste, look and feel.
            </p>
          </div>

          {!canManageAll && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-orange-500/40 bg-orange-500/10 p-4 text-sm">
              <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-foreground/90">
                Only the main account profile can add or delete other profiles. You can still
                update your own profile below.
              </p>
            </div>
          )}

          <ul className="grid gap-3">
            {profiles.map((profile) => {
              const canEdit = canManageAll || currentProfile?.id === profile.id;
              const canDelete = canManageAll && !profile.isRoot;
              return (
                <li
                  key={profile.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <ProfileAvatar profile={profile} size="md" rounded="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{profile.name}</p>
                      {profile.isRoot && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary border border-primary/40 rounded-full px-2 py-0.5">
                          Main
                        </span>
                      )}
                      {profile.isKids && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 border border-orange-500/40 rounded-full px-2 py-0.5">
                          Kids
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {profile.isRoot ? "Account owner" : "Sub-profile"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/profiles/edit/${profile.id}`)}
                      disabled={!canEdit}
                      aria-label={`Edit ${profile.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDelete(profile)}
                      disabled={!canDelete}
                      aria-label={`Delete ${profile.name}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}

            {canAdd && (
              <li>
                <Link
                  to="/profiles/new"
                  className="flex items-center gap-4 rounded-xl border border-dashed border-muted-foreground/40 bg-card/50 p-4 transition-colors hover:border-foreground/60 hover:bg-muted/40"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center text-muted-foreground">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Add Profile</p>
                    <p className="text-xs text-muted-foreground">
                      {MAX_PROFILES_PER_ACCOUNT - profiles.length} slot
                      {MAX_PROFILES_PER_ACCOUNT - profiles.length === 1 ? "" : "s"} remaining
                    </p>
                  </div>
                </Link>
              </li>
            )}
          </ul>

          <div className="mt-10 flex justify-center">
            <Link to="/profiles">
              <Button variant="outline">Done</Button>
            </Link>
          </div>
        </div>
      </main>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name
                ? `${pendingDelete.name}'s viewing history, list, and recommendations will be permanently removed.`
                : "This profile will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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

export default ManageProfiles;
