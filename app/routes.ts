import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chat", "routes/chat.tsx"),
  route("chat-test", "routes/chat-test.tsx"),
  route("playground", "routes/playground.tsx"),
] satisfies RouteConfig;
