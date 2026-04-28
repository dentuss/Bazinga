import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

type NewsPost = {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorUsername: string;
  authorRole: string;
  createdAt: string;
  expiresAt: string;
};

const News = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canPost = user?.role === "ADMIN" || user?.role === "EDITOR";

  const { data: posts = [], isLoading, isError } = useQuery<NewsPost[]>({
    queryKey: ["news"],
    queryFn: () => apiFetch<NewsPost[]>("/api/news"),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Please sign in with an editor or admin account to post news.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch("/api/news", {
        method: "POST",
        authToken: token,
        body: JSON.stringify({ title, content }),
      });
      toast({
        title: "News posted",
        description: "Your update will be visible for the next 7 days.",
      });
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    } catch (error: any) {
      toast({
        title: "Unable to post news",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <p className="text-sm text-primary font-semibold tracking-wide uppercase">Bazinga Newsroom</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2">Latest community news</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Stay up to date with announcements posted by Bazinga editors and administrators. Posts are kept live for
              seven days.
            </p>
          </div>

          {canPost && (
            <Card className="shadow-lg border-muted">
              <CardHeader>
                <CardTitle>Create a news post</CardTitle>
                <CardDescription>Only ADMIN and EDITOR accounts can post announcements.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="news-title">Title</Label>
                    <Input
                      id="news-title"
                      placeholder="e.g. New weekly drops are live"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="news-content">Details</Label>
                    <Textarea
                      id="news-content"
                      placeholder="Share the announcement details..."
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Posting..." : "Post news"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {isLoading && <p className="text-muted-foreground">Loading news...</p>}
            {isError && <p className="text-destructive">Unable to load news right now.</p>}
            {!isLoading && !posts.length && (
              <Card>
                <CardHeader>
                  <CardTitle>No news yet</CardTitle>
                  <CardDescription>Check back later for updates from the team.</CardDescription>
                </CardHeader>
              </Card>
            )}
            {posts.map((post) => (
              <Card key={post.id} className="border-muted">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>
                    Posted by {post.authorUsername} ({post.authorRole}) ·{" "}
                    {new Date(post.createdAt).toLocaleDateString()} · Expires {new Date(post.expiresAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90 whitespace-pre-line">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default News;
