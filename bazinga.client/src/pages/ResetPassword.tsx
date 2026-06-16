import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (!token) setError("This reset link is missing its token.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/auth", { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">
            Pick something you don't use anywhere else. Six characters or more.
          </p>
        </div>

        {done ? (
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-500/15 grid place-items-center">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm">Password updated. Redirecting to sign-in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pwd" className="font-semibold">NEW PASSWORD</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="pwd"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd2" className="font-semibold">CONFIRM PASSWORD</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="pwd2"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy || !token}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Updating…" : "Update password"}
            </Button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Link
              to="/auth"
              className="block text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <span className="inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
