"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || user.user_metadata?.full_name || "");
        setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || "");
        setBio(data.bio || "");
      } else if (error) {
        setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("অনুগ্রহ করে একটি ইমেজ ফাইল নির্বাচন করুন");
      return;
    }

    try {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(path);

      if (urlData?.publicUrl) {
        setAvatarUrl(urlData.publicUrl);
        toast.success("ছবি আপলোড করা হয়েছে");
      }
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error("ছবি আপলোড ব্যর্থ হয়েছে: " + (err.message || "ত্রুটি"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      bio: bio,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      toast.error("প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে");
    } else {
      toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে");
    }
    setSaving(false);
  };

  if (authLoading || (loading && user)) {
    return (
      <main className="flex-1 container max-w-xl py-16 text-center text-muted-foreground font-bn">
        প্রোফাইল লোড হচ্ছে...
      </main>
    );
  }

  if (!user) {
    router.push("/auth");
    return null;
  }

  return (
    <main className="flex-1 container max-w-xl py-12 px-4">
      <div className="bg-card border border-border/80 p-8 rounded-sm shadow-soft">
        <h1 className="text-3xl font-bn font-semibold mb-8 text-foreground">প্রোফাইল (Profile)</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center sm:items-start gap-4 pb-4 border-b border-border/60">
            <label className="text-sm font-medium font-bn text-foreground">প্রোফাইল ছবি (Profile Picture)</label>
            <div className="flex items-center gap-5">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bn text-xl">
                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="font-bn gap-2 text-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {uploading ? "আপলোড হচ্ছে..." : "ছবি পরিবর্তন করুন"}
                </Button>
                <p className="text-[11px] text-muted-foreground font-bn">JPG, PNG বা WEBP (সর্বোচ্চ 5MB)</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium font-bn text-foreground">নাম (Name)</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="আপনার নাম লিখুন..."
              className="font-bn text-base"
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium font-bn text-foreground">বায়ো (Bio)</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="আপনার সম্পর্কে সংক্ষেপে লিখুন..."
              className="font-bn text-base leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <Button type="submit" disabled={saving || uploading} className="font-bn w-full sm:w-auto px-6">
            {saving ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল সংরক্ষণ করুন"}
          </Button>
        </form>
      </div>
    </main>
  );
}
