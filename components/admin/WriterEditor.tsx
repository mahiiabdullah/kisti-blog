"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function WriterEditor() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const isNew = !id;
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [bengaliName, setBengaliName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const fetchWriter = async () => {
      const { data, error } = await supabase.from("writers").select("*").eq("id", id!).single();
      if (error || !data) {
        toast.error("Writer not found");
        router.push("/admin/writers");
        return;
      }
      setName(data.name || "");
      setBengaliName(data.bengali_name || "");
      setSlug(data.slug || "");
      setBio(data.bio || "");
      setNationality(data.nationality || "");
      setBirthYear(data.birth_year?.toString() || "");
      setDeathYear(data.death_year?.toString() || "");
      setProfileImage(data.profile_image || "");
      setIsVisible(data.is_visible ?? true);
      setIsFeatured(data.is_featured ?? false);
      setLoading(false);
    };
    fetchWriter();
  }, [id, isNew, router]);

  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const ext = file.name.split(".").pop();
    const path = `writers/${user.id}/${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setProfileImage(data.publicUrl);
    toast.success("Image uploaded");
  };

  const handleSave = async () => {
    if (!name.trim() || !bengaliName.trim() || !slug.trim()) {
      toast.error("Name, Bengali Name, and Slug are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        bengali_name: bengaliName,
        slug: slug.trim().toLowerCase(),
        bio: bio || null,
        nationality: nationality || null,
        birth_year: birthYear ? parseInt(birthYear) : null,
        death_year: deathYear ? parseInt(deathYear) : null,
        profile_image: profileImage || null,
        is_visible: isVisible,
        is_featured: isFeatured,
      };

      let newId = id;

      if (isNew) {
        const { data, error } = await supabase.from("writers").insert(payload).select("id").single();
        if (error) throw error;
        newId = data.id;
        toast.success("Writer created!");
        router.push(`/admin/writers/${newId}`);
      } else {
        const { error } = await supabase.from("writers").update(payload).eq("id", id!);
        if (error) throw error;
        toast.success("Writer updated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save writer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0">
      <Link href="/admin/writers" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground mb-8 font-en-sans">
        <ArrowLeft className="w-3 h-3" /> All Writers
      </Link>
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bn text-4xl">{isNew ? "নতুন লেখক" : "লেখক সম্পাদনা"}</h1>
        <Button onClick={handleSave} disabled={saving} className="rounded-none gap-2">
          <Save className="w-4 h-4" /> Save
        </Button>
      </div>

      <div className="space-y-8 bg-card border border-border p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Full Name (English) *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Humayun Ahmed" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Bengali Name *</Label>
            <Input value={bengaliName} onChange={(e) => setBengaliName(e.target.value)} placeholder="হুমায়ূন আহমেদ" className="mt-1 font-bn text-xl py-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans">Slug *</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="humayun-ahmed" className="mt-1 font-mono text-sm" />
          <p className="text-xs text-muted-foreground mt-1">URL identifier (e.g., /writers/humayun-ahmed)</p>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans">Profile Image</Label>
          <div className="flex items-center gap-4 mt-2">
            {profileImage && (
              <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-border" />
            )}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 px-4 py-2 border border-border text-sm cursor-pointer hover:bg-secondary rounded-md">
                <Upload className="w-4 h-4" /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
              </label>
              {profileImage && (
                <button onClick={() => setProfileImage("")} className="text-xs text-destructive text-left hover:underline">
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans">Biography</Label>
          <Textarea 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            rows={5} 
            className="mt-1" 
            placeholder="A brief biography of the writer..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Nationality</Label>
            <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Bangladeshi" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Birth Year</Label>
            <Input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="1948" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Death Year (Optional)</Label>
            <Input type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} placeholder="2012" className="mt-1" />
          </div>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch id="visible" checked={isVisible} onCheckedChange={setIsVisible} />
            <Label htmlFor="visible" className="cursor-pointer">Public Visibility</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            <Label htmlFor="featured" className="cursor-pointer">Featured Writer</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
