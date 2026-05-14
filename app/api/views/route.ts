import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// We need a service role client to bypass RLS for inserting views (since users might not be logged in)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    // 1. Gather identifiers to create a unique session fingerprint
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    // 2. Create a secure hash for the session ID
    const sessionId = crypto
      .createHash("sha256")
      .update(`${ip}-${userAgent}`)
      .digest("hex");

    // 3. Call the secure RPC function to increment the view
    // The function contains logic to prevent duplicate increments within a cooldown window
    const { error } = await supabase.rpc("increment_post_view", {
      p_post_id: postId,
      p_session_id: sessionId,
    });

    if (error) {
      console.error("Error tracking view:", error);
      return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("View tracking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
