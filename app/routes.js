import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("/gongang_other", "routes/gongang_other.jsx"),
  route("/profile", "routes/profile.jsx"),
  route("/search", "routes/searchEasy.jsx"),
  route("/submitsong", "routes/page.tsx"),
];
