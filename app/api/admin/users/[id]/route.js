import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin, setUserDisabled, logAdminAction } from "@/lib/auth/admin";

export const runtime = "nodejs";

// Admin-only account actions that need the Auth admin API (and so the
// service role): disabling must ban the auth user, deleting must remove it.
// Plain profile edits (e.g. role changes) stay direct client writes, allowed
// for admins by the user_profiles_guard trigger.

async function resolveTarget(req, context) {
  const { userId, error } = await requireAdmin(req);
  if (error) return { error };

  const { id } = await context.params;
  if (!id) return { error: NextResponse.json({ error: "Missing user id" }, { status: 400 }) };
  if (id === userId) {
    return { error: NextResponse.json({ error: "You can't do this to your own account" }, { status: 400 }) };
  }

  return { id, actorId: userId };
}

// Enable/disable a user: { is_active: boolean }
export async function PATCH(req, context) {
  try {
    const { id, actorId, error } = await resolveTarget(req, context);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (typeof body?.is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
    }

    const { error: updateError } = await setUserDisabled(id, !body.is_active);
    if (updateError) {
      console.error("Failed to update user status:", updateError);
      return NextResponse.json({ error: "Could not update this account" }, { status: 400 });
    }

    await logAdminAction(actorId, body.is_active ? "enable_user" : "disable_user", "user_profiles", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Delete a user's auth account; user_profiles (and favorites, reviews,
// restaurant requests) cascade, orders keep their history with user_id nulled.
export async function DELETE(req, context) {
  try {
    const { id, actorId, error } = await resolveTarget(req, context);
    if (error) return error;

    // restaurants.owner_id is ON DELETE SET NULL -- deleting an owner would
    // leave a live restaurant with nobody able to manage it.
    const { data: ownedRestaurant } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("owner_id", id)
      .limit(1)
      .maybeSingle();

    if (ownedRestaurant) {
      return NextResponse.json(
        { error: "This user owns a restaurant. Delete or reassign the restaurant first." },
        { status: 409 }
      );
    }

    // Snapshot who is being deleted -- the profile row cascades away.
    const { data: target } = await supabaseAdmin.auth.admin.getUserById(id);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      return NextResponse.json({ error: "Could not delete this account" }, { status: 400 });
    }

    await logAdminAction(actorId, "delete_user", "user_profiles", id, { email: target?.user?.email ?? null });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id] failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
