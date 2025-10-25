import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layouts/navigation-bar.tsx", [
    index("routes/home.tsx"),
    route("/playground", "routes/playground.tsx"),
  ]),
] satisfies RouteConfig;
