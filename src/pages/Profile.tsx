import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ProfileData = {
  display_name: string;
  display_name_bn: string;
  avatar_url: string;
  bio: string;
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    display_name: "",
    display_name_bn: "",
    avatar_url: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, display_name_bn, avatar_url, bio")
        .eq("id", user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
      } else if (data) {
        setFormData({
          display_name: data.display_name || "",
          display_name_bn: data.display_name_bn || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl py-10 text-center text-muted-foreground">
          Loading profile...
        </main>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        ...formData
      });

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-10 px-4">
        <h1 className="text-3xl font-bn font-semibold mb-8">প্রোফাইল (Profile)</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium font-en-sans">Display Name</label>
            <Input name="display_name" value={formData.display_name} onChange={handleChange} placeholder="e.g. John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium font-en-sans">Display Name (Bengali)</label>
            <Input name="display_name_bn" value={formData.display_name_bn} onChange={handleChange} placeholder="e.g. জন ডো" className="font-bn" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium font-en-sans">Avatar URL</label>
            <Input name="avatar_url" type="url" value={formData.avatar_url} onChange={handleChange} placeholder="https://example.com/avatar.jpg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium font-en-sans">Bio</label>
            <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} placeholder="Tell us about yourself" />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </main>
    </div>
  );
}
