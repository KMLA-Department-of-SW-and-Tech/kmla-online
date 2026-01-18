import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
const adminEmail = process.env.SMOKE_ADMIN_EMAIL;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

if (!email || !password) {
  console.error("Missing SMOKE_EMAIL or SMOKE_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const signIn = await supabase.auth.signInWithPassword({ email, password });
if (signIn.error || !signIn.data.session) {
  console.error("Failed to sign in test user", signIn.error?.message);
  process.exit(1);
}

const userId = signIn.data.session.user.id;
console.log("Signed in as", userId);

const { data: boards, error: boardsError } = await supabase
  .from("boards")
  .select("id, slug, name, is_public, join_mode")
  .eq("is_active", true)
  .order("position", { ascending: true });

if (boardsError) {
  console.error("Failed to load boards", boardsError.message);
  process.exit(1);
}

console.log("Boards loaded:", boards.length);

const publicBoard = boards.find((board) => board.join_mode === "public");
if (!publicBoard) {
  console.log("No public board found to test join/leave.");
  process.exit(0);
}

const { data: membershipExisting } = await supabase
  .from("board_memberships")
  .select("id, is_locked")
  .eq("board_id", publicBoard.id)
  .eq("user_id", userId)
  .maybeSingle();

if (!membershipExisting) {
  const { error: joinError } = await supabase.from("board_memberships").insert({
    board_id: publicBoard.id,
    user_id: userId,
    role: "member",
  });

  if (joinError) {
    console.error("Failed to join public board", joinError.message);
    process.exit(1);
  }
  console.log("Joined public board", publicBoard.slug || publicBoard.name);
} else {
  console.log("Already a member of public board", publicBoard.slug || publicBoard.name);
}

const { data: createdPost, error: postError } = await supabase
  .from("posts")
  .insert({
    board_id: publicBoard.id,
    user_id: userId,
    title: `Smoke test ${new Date().toISOString()}`,
    content: "Smoke test content",
  })
  .select("id")
  .single();

if (postError) {
  console.error("Failed to create post", postError.message);
  process.exit(1);
}

console.log("Created post", createdPost.id);

const { error: deletePostError } = await supabase
  .from("posts")
  .delete()
  .eq("id", createdPost.id);

if (deletePostError) {
  console.error("Failed to delete post", deletePostError.message);
  process.exit(1);
}

console.log("Deleted post", createdPost.id);

if (membershipExisting?.is_locked !== true) {
  const { error: leaveError } = await supabase
    .from("board_memberships")
    .delete()
    .eq("board_id", publicBoard.id)
    .eq("user_id", userId);

  if (leaveError) {
    console.error("Failed to leave board", leaveError.message);
    process.exit(1);
  }

  console.log("Left public board");
}

const requestBoard = boards.find((board) => board.join_mode === "request");
if (requestBoard) {
  const { error: requestError } = await supabase
    .from("board_join_requests")
    .insert({
      board_id: requestBoard.id,
      user_id: userId,
      message: "Smoke test request",
    });

  if (requestError) {
    console.error("Failed to create join request", requestError.message);
  } else {
    console.log("Created join request for", requestBoard.slug || requestBoard.name);
  }

  if (adminEmail && adminPassword) {
    const adminClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const adminSignIn = await adminClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (adminSignIn.error || !adminSignIn.data.session) {
      console.error("Failed to sign in admin", adminSignIn.error?.message);
      process.exit(1);
    }

    const { data: pendingRequests, error: pendingError } = await adminClient
      .from("board_join_requests")
      .select("id, board_id, user_id")
      .eq("board_id", requestBoard.id)
      .eq("user_id", userId)
      .eq("status", "pending")
      .limit(1);

    if (pendingError) {
      console.error("Failed to fetch pending request", pendingError.message);
      process.exit(1);
    }

    const pending = pendingRequests?.[0];
    if (pending) {
      const { error: approveError } = await adminClient
        .from("board_join_requests")
        .update({
          status: "approved",
          reviewed_by: adminSignIn.data.session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", pending.id);

      if (approveError) {
        console.error("Failed to approve join request", approveError.message);
        process.exit(1);
      }

      const { error: membershipError } = await adminClient
        .from("board_memberships")
        .insert({
          board_id: requestBoard.id,
          user_id: userId,
          role: "member",
        });

      if (membershipError) {
        console.error("Failed to create membership", membershipError.message);
        process.exit(1);
      }

      console.log("Approved join request and added membership");
    }
  } else {
    console.log("Admin credentials not provided; skipping approval step.");
  }
}

console.log("Smoke checks complete.");
