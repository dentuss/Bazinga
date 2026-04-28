import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type AdminUser = {
  id: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  role?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type AdminComic = {
  id: number;
  title: string;
  author?: string | null;
  series?: string | null;
  isbn?: string | null;
  description?: string | null;
  mainCharacter?: string | null;
  publishedYear?: number | null;
  price?: number | null;
  image?: string | null;
  comicType?: string | null;
  redacted?: boolean;
};

const initialFormState = {
  title: "",
  author: "",
  isbn: "",
  description: "",
  mainCharacter: "",
  series: "",
  publishedYear: "",
  price: "",
  image: "",
  isDigitalOnly: false,
};

const initialUserFormState = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  role: "USER",
};

const Admin = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(initialFormState);
  const [userSearch, setUserSearch] = useState("");
  const [comicSearch, setComicSearch] = useState("");
  const [userFormState, setUserFormState] = useState(initialUserFormState);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editFormState, setEditFormState] = useState(initialUserFormState);
  const [editingComic, setEditingComic] = useState<AdminComic | null>(null);
  const [editComicFormState, setEditComicFormState] = useState(initialFormState);
  const isAdmin = user?.role === "ADMIN";

  const { data: users = [], isError: usersError } = useQuery<AdminUser[]>({
    queryKey: ["admin-users", userSearch],
    queryFn: () =>
      token
        ? apiFetch<AdminUser[]>(`/api/admin/users${userSearch.trim() ? `?query=${encodeURIComponent(userSearch)}` : ""}`, {
            authToken: token,
          })
        : Promise.resolve([]),
    enabled: Boolean(token),
  });

  const {
    data: adminComics = [],
    isError: adminComicsError,
    isLoading: adminComicsLoading,
  } = useQuery<AdminComic[]>({
    queryKey: ["admin-comics"],
    queryFn: () => (token ? apiFetch<AdminComic[]>("/api/admin/comics", { authToken: token }) : Promise.resolve([])),
    enabled: Boolean(token),
  });

  const hasAdminAccess = useMemo(() => Boolean(user && isAdmin), [user, isAdmin]);
  const filteredAdminComics = useMemo(() => {
    const query = comicSearch.trim().toLowerCase();
    if (!query) {
      return adminComics;
    }
    return adminComics.filter((comic) => {
      const title = comic.title.toLowerCase();
      const series = comic.series?.toLowerCase() ?? "";
      const author = comic.author?.toLowerCase() ?? "";
      return title.includes(query) || series.includes(query) || author.includes(query);
    });
  }, [adminComics, comicSearch]);

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateUserField = (field: keyof typeof userFormState, value: string) => {
    setUserFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditField = (field: keyof typeof editFormState, value: string) => {
    setEditFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditComicField = (field: keyof typeof editComicFormState, value: string) => {
    setEditComicFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Please sign in with an admin account to add comics.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiFetch("/api/comics", {
        method: "POST",
        authToken: token,
        body: JSON.stringify({
          title: formState.title,
          author: formState.author || null,
          isbn: formState.isbn || null,
          description: formState.description || null,
          series: formState.series || null,
          publishedYear: formState.publishedYear ? Number(formState.publishedYear) : null,
          price: formState.price ? Number(formState.price) : null,
          image: formState.image || null,
          mainCharacter: formState.mainCharacter || null,
          comicType: formState.isDigitalOnly ? "ONLY_DIGITAL" : null,
        }),
      });
      toast({
        title: "Comic created",
        description: `${formState.title} has been added to the catalog.`,
      });
      setFormState(initialFormState);
      queryClient.invalidateQueries({ queryKey: ["admin-comics"] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    } catch (error: any) {
      toast({
        title: "Unable to add comic",
        description: error?.message || "Please check the form details and try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Please sign in with an admin account to manage users.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        authToken: token,
        body: JSON.stringify({
          username: userFormState.username,
          email: userFormState.email,
          password: userFormState.password,
          firstName: userFormState.firstName || null,
          lastName: userFormState.lastName || null,
          dateOfBirth: userFormState.dateOfBirth || null,
          role: userFormState.role || "USER",
        }),
      });
      toast({
        title: "User created",
        description: `${userFormState.username} is ready to sign in.`,
      });
      setUserFormState(initialUserFormState);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast({
        title: "Unable to create user",
        description: error?.message || "Please check the user details and try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (selected: AdminUser) => {
    setEditingUser(selected);
    setEditFormState({
      username: selected.username || "",
      email: selected.email || "",
      password: "",
      firstName: selected.firstName || "",
      lastName: selected.lastName || "",
      dateOfBirth: selected.dateOfBirth || "",
      role: selected.role || "USER",
    });
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editingUser) {
      return;
    }

    try {
      await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        authToken: token,
        body: JSON.stringify({
          username: editFormState.username,
          email: editFormState.email,
          password: editFormState.password || undefined,
          firstName: editFormState.firstName,
          lastName: editFormState.lastName,
          dateOfBirth: editFormState.dateOfBirth || null,
          role: editFormState.role,
        }),
      });
      toast({
        title: "User updated",
        description: `${editFormState.username} has been updated.`,
      });
      setEditingUser(null);
      setEditFormState(initialUserFormState);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast({
        title: "Unable to update user",
        description: error?.message || "Please review the changes and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRedaction = async (comicId: number, nextRedacted: boolean) => {
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Please sign in with an admin account to update comic visibility.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiFetch(`/api/admin/comics/${comicId}/redaction`, {
        method: "PUT",
        authToken: token,
        body: JSON.stringify({ redacted: nextRedacted }),
      });
      toast({
        title: nextRedacted ? "Comic redacted" : "Comic restored",
        description: nextRedacted
          ? "The comic has been removed from the storefront."
          : "The comic is visible again in the storefront.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-comics"] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    } catch (error: any) {
      toast({
        title: "Unable to update comic",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const handleEditComic = (selected: AdminComic) => {
    setEditingComic(selected);
    setEditComicFormState({
      title: selected.title || "",
      author: selected.author || "",
      isbn: selected.isbn || "",
      description: selected.description || "",
      mainCharacter: selected.mainCharacter || "",
      series: selected.series || "",
      publishedYear: selected.publishedYear ? String(selected.publishedYear) : "",
      price: selected.price !== null && selected.price !== undefined ? String(selected.price) : "",
      image: selected.image || "",
      isDigitalOnly: selected.comicType === "ONLY_DIGITAL",
    });
  };

  const handleUpdateComic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editingComic) {
      return;
    }

    try {
      await apiFetch(`/api/admin/comics/${editingComic.id}`, {
        method: "PUT",
        authToken: token,
        body: JSON.stringify({
          title: editComicFormState.title,
          author: editComicFormState.author || null,
          isbn: editComicFormState.isbn || null,
          description: editComicFormState.description || null,
          series: editComicFormState.series || null,
          publishedYear: editComicFormState.publishedYear ? Number(editComicFormState.publishedYear) : null,
          price: editComicFormState.price ? Number(editComicFormState.price) : null,
          image: editComicFormState.image || null,
          mainCharacter: editComicFormState.mainCharacter || null,
          comicType: editComicFormState.isDigitalOnly ? "ONLY_DIGITAL" : null,
        }),
      });
      toast({
        title: "Comic updated",
        description: `${editComicFormState.title} has been updated.`,
      });
      setEditingComic(null);
      setEditComicFormState(initialFormState);
      queryClient.invalidateQueries({ queryKey: ["admin-comics"] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    } catch (error: any) {
      toast({
        title: "Unable to update comic",
        description: error?.message || "Please check the comic details and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComic = async (selected: AdminComic) => {
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Please sign in with an admin account to delete comics.",
        variant: "destructive",
      });
      return;
    }

    if (!selected.redacted) {
      toast({
        title: "Redact first",
        description: "Comics must be redacted before they can be deleted.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(`Permanently delete ${selected.title}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/api/admin/comics/${selected.id}`, {
        method: "DELETE",
        authToken: token,
      });
      toast({
        title: "Comic deleted",
        description: `${selected.title} has been removed from the catalog.`,
      });
      if (editingComic?.id === selected.id) {
        setEditingComic(null);
        setEditComicFormState(initialFormState);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-comics"] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    } catch (error: any) {
      toast({
        title: "Unable to delete comic",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-16 flex-1">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
              <CardDescription>Sign in with an administrator account to manage comics.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")}>Go to sign in</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-16 flex-1">
          <Card className="max-w-2xl mx-auto border-destructive/40">
            <CardHeader>
              <CardTitle>Access denied</CardTitle>
              <CardDescription>Only ADMIN users can add new comics.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/")}>
                Return to storefront
              </Button>
              <Button onClick={() => navigate("/auth")}>Switch account</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <p className="text-sm text-primary font-semibold tracking-wide uppercase">Admin console</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2">Add a new comic</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Fill in the catalog details below. The form mirrors the backend comic entity, including pricing metadata.
            </p>
          </div>

          <Card className="shadow-lg border-muted">
            <CardHeader>
              <CardTitle>Comic details</CardTitle>
              <CardDescription>Provide the information customers will see in the storefront.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Amazing Fantasy #15"
                      value={formState.title}
                      onChange={(event) => updateField("title", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      placeholder="Stan Lee"
                      value={formState.author}
                      onChange={(event) => updateField("author", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="series">Series</Label>
                    <Input
                      id="series"
                      placeholder="Spider-Man"
                      value={formState.series}
                      onChange={(event) => updateField("series", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mainCharacter">Main character</Label>
                    <Input
                      id="mainCharacter"
                      placeholder="Peter Parker"
                      value={formState.mainCharacter}
                      onChange={(event) => updateField("mainCharacter", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      placeholder="978-1302926735"
                      value={formState.isbn}
                      onChange={(event) => updateField("isbn", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publishedYear">Published year</Label>
                    <Input
                      id="publishedYear"
                      type="number"
                      placeholder="1962"
                      min="1900"
                      max="2100"
                      value={formState.publishedYear}
                      onChange={(event) => updateField("publishedYear", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="14.99"
                      value={formState.price}
                      onChange={(event) => updateField("price", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Cover image URL</Label>
                    <Input
                      id="image"
                      placeholder="https://..."
                      value={formState.image}
                      onChange={(event) => updateField("image", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="digitalOnly">Digital only</Label>
                    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                      <Switch
                        id="digitalOnly"
                        checked={formState.isDigitalOnly}
                        onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isDigitalOnly: checked }))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Enable to list this comic as a digital-only release.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Short description for the storefront..."
                    rows={5}
                    value={formState.description}
                    onChange={(event) => updateField("description", event.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Only administrators can submit this form. Pricing should match the backend precision.
                  </p>
                  <Button type="submit" className="px-8">
                    Add comic
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="pt-4 border-t border-muted">
            <p className="text-sm text-primary font-semibold tracking-wide uppercase">Comic moderation</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mt-2">Redact comics</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Redacted comics are hidden from the storefront and digital reader views. Restore them at any time. Hard
              deletes are available after redaction.
            </p>
          </div>

          <Card className="shadow-lg border-muted">
            <CardHeader>
              <CardTitle>Storefront visibility</CardTitle>
              <CardDescription>Search the catalog and toggle redaction for each comic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search comics by title, series, or author..."
                value={comicSearch}
                onChange={(event) => setComicSearch(event.target.value)}
              />
              {adminComicsLoading && <p className="text-sm text-muted-foreground">Loading comics...</p>}
              {adminComicsError && <p className="text-sm text-destructive">Unable to load comics right now.</p>}
              {!adminComicsLoading && !adminComicsError && !filteredAdminComics.length && (
                <p className="text-sm text-muted-foreground">No comics match your search.</p>
              )}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {filteredAdminComics.map((comic) => (
                  <div key={comic.id} className="border border-muted rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{comic.title}</p>
                        <p className="text-sm text-muted-foreground">{comic.series || "No series listed"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={comic.redacted ? "secondary" : "destructive"}
                          onClick={() => handleRedaction(comic.id, !comic.redacted)}
                        >
                          {comic.redacted ? "Restore" : "Redact"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditComic(comic)}>
                          Edit
                        </Button>
                        {comic.redacted && (
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteComic(comic)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {comic.author ? `Author: ${comic.author}` : "No author on file"} · Status:{" "}
                      {comic.redacted ? "Redacted" : "Live"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {editingComic && (
            <Card className="shadow-lg border-muted">
              <CardHeader>
                <CardTitle>Edit comic</CardTitle>
                <CardDescription>Update the catalog details for {editingComic.title}.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleUpdateComic}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        placeholder="Amazing Fantasy #15"
                        value={editComicFormState.title}
                        onChange={(event) => updateEditComicField("title", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-author">Author</Label>
                      <Input
                        id="edit-author"
                        placeholder="Stan Lee"
                        value={editComicFormState.author}
                        onChange={(event) => updateEditComicField("author", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-series">Series</Label>
                      <Input
                        id="edit-series"
                        placeholder="Spider-Man"
                        value={editComicFormState.series}
                        onChange={(event) => updateEditComicField("series", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-main-character">Main character</Label>
                      <Input
                        id="edit-main-character"
                        placeholder="Peter Parker"
                        value={editComicFormState.mainCharacter}
                        onChange={(event) => updateEditComicField("mainCharacter", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-isbn">ISBN</Label>
                      <Input
                        id="edit-isbn"
                        placeholder="978-1302926735"
                        value={editComicFormState.isbn}
                        onChange={(event) => updateEditComicField("isbn", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-published-year">Published year</Label>
                      <Input
                        id="edit-published-year"
                        type="number"
                        placeholder="1962"
                        min="1900"
                        max="2100"
                        value={editComicFormState.publishedYear}
                        onChange={(event) => updateEditComicField("publishedYear", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="14.99"
                        value={editComicFormState.price}
                        onChange={(event) => updateEditComicField("price", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-image">Cover image URL</Label>
                      <Input
                        id="edit-image"
                        placeholder="https://..."
                        value={editComicFormState.image}
                        onChange={(event) => updateEditComicField("image", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-digital-only">Digital only</Label>
                      <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                        <Switch
                          id="edit-digital-only"
                          checked={editComicFormState.isDigitalOnly}
                          onCheckedChange={(checked) =>
                            setEditComicFormState((prev) => ({ ...prev, isDigitalOnly: checked }))
                          }
                        />
                        <p className="text-sm text-muted-foreground">
                          Enable to list this comic as a digital-only release.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Short description for the storefront..."
                      rows={5}
                      value={editComicFormState.description}
                      onChange={(event) => updateEditComicField("description", event.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Updating a comic will refresh the storefront listing immediately.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" className="px-8">
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingComic(null);
                          setEditComicFormState(initialFormState);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="pt-4 border-t border-muted">
            <p className="text-sm text-primary font-semibold tracking-wide uppercase">User management</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mt-2">Manage accounts</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Search, create, and update user profiles and roles. Changes are reflected immediately for each account.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-lg border-muted">
              <CardHeader>
                <CardTitle>Create user</CardTitle>
                <CardDescription>Add a new account and assign a role.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateUser}>
                  <div className="space-y-2">
                    <Label htmlFor="new-username">Username</Label>
                    <Input
                      id="new-username"
                      value={userFormState.username}
                      onChange={(event) => updateUserField("username", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={userFormState.email}
                      onChange={(event) => updateUserField("email", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={userFormState.password}
                      onChange={(event) => updateUserField("password", event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-first-name">First name</Label>
                      <Input
                        id="new-first-name"
                        value={userFormState.firstName}
                        onChange={(event) => updateUserField("firstName", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-last-name">Last name</Label>
                      <Input
                        id="new-last-name"
                        value={userFormState.lastName}
                        onChange={(event) => updateUserField("lastName", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-dob">Date of birth</Label>
                      <Input
                        id="new-dob"
                        type="date"
                        value={userFormState.dateOfBirth}
                        onChange={(event) => updateUserField("dateOfBirth", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-role">Role</Label>
                      <Select
                        value={userFormState.role}
                        onValueChange={(value) => updateUserField("role", value)}
                      >
                        <SelectTrigger id="new-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="EDITOR">EDITOR</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit">Create user</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-muted">
              <CardHeader>
                <CardTitle>Search users</CardTitle>
                <CardDescription>Find users by username, email, or name.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                />
                {usersError && <p className="text-sm text-destructive">Unable to load users right now.</p>}
                {!usersError && !users.length && (
                  <p className="text-sm text-muted-foreground">No users found yet.</p>
                )}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {users.map((entry) => (
                    <div key={entry.id} className="border border-muted rounded-lg p-3 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{entry.username}</p>
                          <p className="text-sm text-muted-foreground">{entry.email}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleEditUser(entry)}>
                          Edit
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.firstName || entry.lastName
                          ? `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim()
                          : "No name on file"}{" "}
                        · Role: {entry.role || "USER"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {editingUser && (
            <Card className="shadow-lg border-muted">
              <CardHeader>
                <CardTitle>Edit user</CardTitle>
                <CardDescription>Update profile details or reset the password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleUpdateUser}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-username">Username</Label>
                      <Input
                        id="edit-username"
                        value={editFormState.username}
                        onChange={(event) => updateEditField("username", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editFormState.email}
                        onChange={(event) => updateEditField("email", event.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password">New password</Label>
                    <Input
                      id="edit-password"
                      type="password"
                      value={editFormState.password}
                      onChange={(event) => updateEditField("password", event.target.value)}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-first-name">First name</Label>
                      <Input
                        id="edit-first-name"
                        value={editFormState.firstName}
                        onChange={(event) => updateEditField("firstName", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-last-name">Last name</Label>
                      <Input
                        id="edit-last-name"
                        value={editFormState.lastName}
                        onChange={(event) => updateEditField("lastName", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-dob">Date of birth</Label>
                      <Input
                        id="edit-dob"
                        type="date"
                        value={editFormState.dateOfBirth}
                        onChange={(event) => updateEditField("dateOfBirth", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role</Label>
                      <Select
                        value={editFormState.role}
                        onValueChange={(value) => updateEditField("role", value)}
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="EDITOR">EDITOR</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit">Save changes</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(null);
                        setEditFormState(initialUserFormState);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
