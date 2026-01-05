import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("/gongang_other", "routes/gongang_other.jsx"),
  route("/profile", "routes/profile.jsx"),
  route("/search", "routes/searchEasy.jsx"),
  route("/submitsong", "routes/page.tsx"),
  route("/boards", "routes/boards.jsx"),
  route("/boards/request", "routes/boards-request.jsx"),
  // Dynamic board pages (must come after static /boards routes)
  route("/boards/:name", "routes/board.jsx"),
];
