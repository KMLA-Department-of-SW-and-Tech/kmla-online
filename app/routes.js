import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("/profile", "routes/profile.jsx"),
  route("/search", "routes/searchEasy.jsx"),
  route("/submitsong", "routes/page.tsx"),
];
