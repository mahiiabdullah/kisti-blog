"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  displayName: z.string().trim().max(100).optional(),
});

export default function AuthPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!loading && user) {
    router.push(isAdmin ? "/admin" : "/profile");
    return null;
  }

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/profile` : "/profile",
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) {
          toast.error(error.message);
          setBusy(false);
          return;
        }
        toast.success("Registration successful! Please check your email inbox to verify your account.");
        setMode("signin");
        setBusy(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          setBusy(false);
          return;
        }
        toast.success("স্বাগতম!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 container max-w-md py-20">
      <div className="text-center mb-10">
        <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-3">
          ◆ {mode === "signin" ? "Welcome back" : "Join the journal"}
        </div>
        <h1 className="font-bn text-4xl">
          {mode === "signin" ? "প্রবেশ" : "নিবন্ধন"}
        </h1>
      </div>

      <form onSubmit={handle} className="space-y-5 bg-card border border-border p-8 shadow-soft">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="dn" className="font-en-sans text-xs uppercase tracking-wider">Display name</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="em" className="font-en-sans text-xs uppercase tracking-wider">Email</Label>
          <Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw" className="font-en-sans text-xs uppercase tracking-wider">Password</Label>
          <div className="relative">
            <Input 
              id="pw" 
              type={showPassword ? "text" : "password"} 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              minLength={6} 
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={busy} className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-none font-en-sans uppercase tracking-wider text-xs h-11">
          {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
          {mode === "signin" ? "নতুন? নিবন্ধন করুন" : "আগে থেকেই অ্যাকাউন্ট আছে? প্রবেশ করুন"}
        </button>
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground text-center font-en italic">
            The first registered user automatically becomes Super Admin.
          </p>
        )}
      </form>
    </main>
  );
}
