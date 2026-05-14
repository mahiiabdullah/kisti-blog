import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize a service role client to bypass RLS and access the Admin API
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // Verify the caller is a super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single();

    if (roleError || !roleData) {
      return NextResponse.json({ error: "Forbidden: Only super_admin can delete users" }, { status: 403 });
    }

    // Prevent self-deletion via admin panel just in case
    if (user.id === userIdToDelete) {
      return NextResponse.json({ error: "Cannot delete your own super_admin account here" }, { status: 400 });
    }

    // Delete the user completely using the Supabase Admin API
    // This will delete them from auth.users, which automatically cascades to profiles, user_roles, comments, etc.
    const { data, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

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
