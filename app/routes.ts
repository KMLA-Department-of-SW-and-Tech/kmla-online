import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("", "routes/_app.jsx", [
    route("gongang_other", "routes/gongang_other.jsx"),
    route("profile", "routes/profile.jsx"),
    route("submitsong", "routes/page.tsx"),
    route("boards/request", "routes/boards-request.jsx"),
    route("boards/:slug/members", "routes/board.$slug.members.jsx"),
    route("posts/new", "routes/posts.new.jsx"),
    route("my-boards", "routes/my-boards.jsx"),
    route("join-requests", "routes/join-requests.jsx"),
  ]),
  route("/login", "routes/login.tsx"),
  route("/sign-up", "routes/sign-up.tsx"),
  route("/forgot-password", "routes/forgot-password.tsx"),
  route("/update-password", "routes/update-password.tsx"),
  route("/logout", "routes/logout.tsx"),
  route("/protected", "routes/protected.tsx"),
  route("/auth/confirm", "routes/auth.confirm.tsx"),
  route("/auth/error", "routes/auth.error.tsx"),
  route("/search", "routes/searchEasy.jsx"),
  route("/boards", "routes/boards.jsx"),
  route("/boards/:slug/join", "routes/board.$slug.join.jsx"),
  // Dynamic board pages (must come after static /boards routes)
  route("/boards/:slug", "routes/board.jsx"),
  route("/posts/:id", "routes/posts.$id.jsx"),
] satisfies RouteConfig;
