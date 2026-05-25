"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="border border-border p-4 text-muted-foreground">Loading editor…</div>,
});

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleBn, setTitleBn] = useState("আমাদের সম্পর্কে");
  const [bodyBn, setBodyBn] = useState("");
  const [rowId, setRowId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("site_pages")
        .select("*")
        .eq("slug", "about")
        .maybeSingle();

      if (data) {
        setRowId(data.id);
        setTitleBn(data.title_bn ?? "আমাদের সম্পর্কে");
        setBodyBn(data.body_bn ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        slug: "about",
        title_bn: titleBn,
        body_bn: bodyBn,
        updated_at: new Date().toISOString(),
      };

      if (rowId) {
        const { error } = await (supabase as any).from("site_pages").update(payload).eq("id", rowId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any).from("site_pages").insert(payload).select("id").single();
        if (error) throw error;
        setRowId(data.id);
      }
      toast.success("About page saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">লোড হচ্ছে…</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <h1 className="font-bn text-4xl mb-1">আমাদের সম্পর্কে</h1>
          <p className="text-sm text-muted-foreground font-en">Edit the public About page content</p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-none"
        >
          {saving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans mb-1 block">Page Title (Bengali)</Label>
          <Input
            value={titleBn}
            onChange={(e) => setTitleBn(e.target.value)}
            className="font-bn text-xl h-12"
          />
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans mb-1 block">Body Content</Label>
          <RichTextEditor
            content={bodyBn}
            onChange={setBodyBn}
            placeholder="আমাদের সম্পর্কে লিখুন…"
            dir="ltr"
            draftKey="kisti-draft-about"
          />
        </div>
      </div>
    </div>
  );
}
