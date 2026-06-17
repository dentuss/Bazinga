import { useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Loader2, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  twoFactorConfirm,
  twoFactorDisable,
  twoFactorSetup,
  type TwoFactorSetupResponse,
} from "@/lib/auth";

type Phase = "idle" | "enrolling" | "disabling";

/**
 * Profile → Security card for enrolling / removing a TOTP authenticator
 * (Google Authenticator, Authy, 1Password…). Renders the QR from the server's
 * otpauth URI client-side, then confirms with the first 6-digit code.
 */
const TwoFactorSetup = () => {
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const enabled = Boolean(user?.twoFactorEnabled);

  const [phase, setPhase] = useState<Phase>("idle");
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setPhase("idle");
    setSetup(null);
    setQr(null);
    setCode("");
    setError(null);
  };

  const startEnroll = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await twoFactorSetup(token);
      setSetup(res);
      setQr(await QRCode.toDataURL(res.otpauthUri, { width: 220, margin: 1 }));
      setPhase("enrolling");
      setCode("");
    } catch (err) {
      toast({
        title: "Could not start 2FA setup",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async (value: string) => {
    if (!token || value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await twoFactorConfirm(token, value);
      updateUser({ twoFactorEnabled: true });
      toast({ title: "Two-factor enabled", description: "We'll ask for a code next time you sign in." });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code.");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async (value: string) => {
    if (!token || value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await twoFactorDisable(token, value);
      updateUser({ twoFactorEnabled: false });
      toast({ title: "Two-factor disabled" });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code.");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the secret is visible anyway */
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/15 grid place-items-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold">Two-factor authentication</h2>
            {enabled ? (
              <span className="text-[10px] uppercase tracking-wider rounded-full bg-green-500/15 text-green-500 border border-green-500/40 px-2 py-0.5">
                On
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider rounded-full border border-border text-muted-foreground px-2 py-0.5">
                Off
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Add a code from an authenticator app (Google Authenticator, Authy, 1Password) on top of your
            password or sign-in link.
          </p>
        </div>
      </div>

      {/* Idle controls */}
      {phase === "idle" && (
        <div className="flex flex-wrap gap-3">
          {enabled ? (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                setPhase("disabling");
                setCode("");
                setError(null);
              }}
            >
              <ShieldOff className="h-4 w-4" />
              Turn off 2FA
            </Button>
          ) : (
            <Button className="gap-2" onClick={startEnroll} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              Set up authenticator app
            </Button>
          )}
        </div>
      )}

      {/* Enrollment */}
      {phase === "enrolling" && setup && (
        <div className="rounded-lg border border-border bg-background/40 p-5 space-y-5">
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Open your authenticator app and scan this QR code.</li>
            <li>Enter the 6-digit code it shows to confirm.</li>
          </ol>

          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div className="rounded-lg bg-white p-3 shrink-0">
              {qr ? (
                <img src={qr} alt="2FA QR code" className="h-44 w-44" />
              ) : (
                <div className="h-44 w-44 grid place-items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-muted px-2 py-1 text-xs font-mono">
                  {setup.secret}
                </code>
                <Button type="button" variant="ghost" size="icon" onClick={copySecret} aria-label="Copy secret">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-center">Enter the 6-digit code</p>
            <CodeInput
              value={code}
              onChange={setCode}
              onComplete={confirmEnroll}
              autoFocus
              disabled={busy}
              error={Boolean(error)}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={() => confirmEnroll(code)} disabled={busy || code.length !== 6}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify &amp; enable
            </Button>
            <Button variant="ghost" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Disable confirmation */}
      {phase === "disabling" && (
        <div className="rounded-lg border border-border bg-background/40 p-5 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Enter a current code from your authenticator to turn off 2FA.
          </p>
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={confirmDisable}
            autoFocus
            disabled={busy}
            error={Boolean(error)}
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => confirmDisable(code)}
              disabled={busy || code.length !== 6}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Turn off 2FA
            </Button>
            <Button variant="ghost" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
