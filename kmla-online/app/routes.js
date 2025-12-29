import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("/boards", "routes/boards.jsx"),
  route("/boards/request", "routes/boards-request.jsx"),
  // Dynamic board pages (must come after static /boards routes)
  route("/boards/:name", "routes/board.jsx"),
];
