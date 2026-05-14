"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminWritersPage() {
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWriters();
  }, []);

  const fetchWriters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("writers")
      .select("*")
      .order("name", { ascending: true });
      
    if (error) {
      toast.error("Failed to load writers");
    } else {
      setWriters(data || []);
    }
    setLoading(false);
  };

  const filteredWriters = writers.filter((w) => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.bengali_name.includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bn">লেখক ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage writers, authors, and translators.</p>
        </div>
        <Link href="/admin/writers/new">
          <Button className="rounded-none gap-2">
            <Plus className="w-4 h-4" /> Add Writer
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border shadow-sm">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search writers by name..." 
            className="border-0 shadow-none focus-visible:ring-0 max-w-sm"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading writers...</div>
        ) : filteredWriters.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No writers found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredWriters.map((writer) => (
              <div key={writer.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-4">
                  {writer.profile_image ? (
                    <img src={writer.profile_image} alt={writer.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border text-xs font-medium text-muted-foreground">
                      {writer.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bn text-xl leading-none">{writer.bengali_name}</h3>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                      <span>{writer.name}</span>
                      <span className="font-mono text-[10px]">/{writer.slug}</span>
                      {!writer.is_visible && <span className="text-destructive font-semibold">HIDDEN</span>}
                    </div>
                  </div>
                </div>
                <Link href={`/admin/writers/${writer.id}`}>
                  <Button variant="ghost" size="sm" className="rounded-none text-xs">
                    <Edit2 className="w-3 h-3 mr-2" /> Edit
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
