import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";

function numOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (trimmed.length === 0) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function Settings() {
  const { user, profile, isAnonymous, signOut, upgradeAnonymous } = useAuth();
  const { prefs, loading: prefsLoading, update } = useUserPreferences();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  // Preferences form state.
  const [defaultLocation, setDefaultLocation] = useState("");
  const [currency, setCurrency] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (prefsLoading) return;
    setDefaultLocation(prefs.default_location ?? "");
    setCurrency(prefs.currency ?? "");
    const km = prefs.search_radius_m != null ? prefs.search_radius_m / 1000 : 5;
    setRadiusKm(String(km));
    setPriceMin(prefs.price_range_min != null ? String(prefs.price_range_min) : "");
    setPriceMax(prefs.price_range_max != null ? String(prefs.price_range_max) : "");
  }, [prefs, prefsLoading]);

  // Upgrade form state.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/login");
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    const kmNum = Number(radiusKm);
    const radiusM =
      Number.isFinite(kmNum) && kmNum > 0 ? Math.round(kmNum * 1000) : null;
    if (radiusM != null && (kmNum < 1 || kmNum > 50)) {
      toast.error("Search radius must be between 1 and 50 km");
      return;
    }
    setSavingPrefs(true);
    const { error } = await update({
      default_location: defaultLocation.trim() || null,
      currency: currency.trim() || null,
      search_radius_m: radiusM,
      price_range_min: numOrNull(priceMin),
      price_range_max: numOrNull(priceMax),
    });
    setSavingPrefs(false);
    if (error) {
      toast.error(error.message || "Failed to save preferences");
    } else {
      toast.success("Preferences saved");
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setUpgrading(true);
    const { error } = await upgradeAnonymous(email.trim(), password);
    setUpgrading(false);
    if (error) {
      toast.error(error.message || "Failed to upgrade account");
      return;
    }
    toast.success("Account upgraded. Check your email to confirm.");
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm">{user?.email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Full name</Label>
            <p className="text-sm">{profile?.full_name ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Defaults TR-ACE uses when your query is ambiguous. Leave blank to skip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSavePrefs}>
            <div className="space-y-1.5">
              <Label htmlFor="pref-location">Default location</Label>
              <Input
                id="pref-location"
                placeholder="e.g. Lagos, Nigeria"
                value={defaultLocation}
                onChange={(e) => setDefaultLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pref-currency">Currency</Label>
              <Input
                id="pref-currency"
                placeholder="ISO code — e.g. USD, NGN, EUR"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pref-radius">Search radius (km)</Label>
              <Input
                id="pref-radius"
                type="number"
                min={1}
                max={50}
                step={1}
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pref-price-min">Price min</Label>
                <Input
                  id="pref-price-min"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pref-price-max">Price max</Label>
                <Input
                  id="pref-price-max"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="—"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={savingPrefs || prefsLoading}>
              {savingPrefs ? 'Saving…' : 'Save preferences'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isAnonymous && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade account</CardTitle>
            <CardDescription>
              You're using a guest session. Create a permanent account to save
              preferences and bookmarks across devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpgrade}>
              <div className="space-y-1.5">
                <Label htmlFor="up-email">Email</Label>
                <Input
                  id="up-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-password">Password</Label>
                <Input
                  id="up-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-confirm">Confirm password</Label>
                <Input
                  id="up-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={upgrading}>
                {upgrading ? 'Upgrading…' : 'Upgrade account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {signingOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  );
}
