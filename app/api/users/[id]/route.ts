import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic so Next.js never tries to statically evaluate this route.
// SUPABASE_SERVICE_ROLE_KEY is only available at runtime (Vercel env), not build time.
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
      return NextResponse.json({ error: "Server misconfiguration: service key missing" }, { status: 500 });
    }

    // Service-role client — only for auth.admin.deleteUser() and bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const userIdToDelete = params.id;
    if (!userIdToDelete) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Verify the caller is authenticated via the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // Validate the caller's JWT.
    // Pass the token directly to getUser(jwt) — this makes a server-to-Supabase
    // Auth API call and validates the token regardless of which client key is used.
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // Verify the caller is a super_admin (use admin client to bypass RLS)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single();

    if (roleError || !roleData) {
      return NextResponse.json({ error: "Forbidden: Only super_admin can delete users" }, { status: 403 });
    }

    // Prevent self-deletion via admin panel
    if (user.id === userIdToDelete) {
      return NextResponse.json({ error: "Cannot delete your own super_admin account here" }, { status: 400 });
    }

    // Delete the user completely using the Supabase Admin API.
    // Cascades to profiles, user_roles, comments, etc. via FK constraints.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      console.error("Failed to delete user via Admin API:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("User deletion error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
