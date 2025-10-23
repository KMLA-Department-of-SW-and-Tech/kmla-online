import { Outlet } from "react-router";

export default function NavigationBar() {
  return (
    <div className="h-screen">
      <Outlet />
      <nav className="flex fixed bottom-0">
        <div>home</div>
        <div>study</div>
        <div>posts</div>
        <div>chat</div>
        <div>profile</div>
      </nav>
    </div>
  );
}
