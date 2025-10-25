import { NavLink, Outlet } from "react-router";
import type { Route } from "../+types/root";

export function loader() {
  const newPost = true;
  const newChatCount = 2;
  return { newPost, newChatCount };
}

export default function NavigationBar({
  loaderData,
}: Readonly<Route.ComponentProps>) {
  const { newPost, newChatCount } = loaderData;
  return (
    <div className="h-screen bg-background">
      <Outlet />
      <nav className="flex fixed bg-white w-screen bottom-0 justify-around py-4">
        <NavLink to="/" className="w-7 h-7" end>
          {({ isActive }) =>
            isActive ? (
              <img
                src="/icons/home-active.svg"
                className="h-full aspect-square"
                alt=""
              />
            ) : (
              <img
                src="/icons/home.svg"
                className="h-full aspect-square"
                alt=""
              />
            )
          }
        </NavLink>
        <NavLink to="/academics" className="w-7 h-7">
          {({ isActive }) =>
            isActive ? (
              <img
                src="/icons/school-active.svg"
                className="h-full aspect-square"
                alt=""
              />
            ) : (
              <img
                src="/icons/school.svg"
                className="h-full aspect-square"
                alt=""
              />
            )
          }
        </NavLink>
        <NavLink to="/board" className="w-7 h-7 relative">
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive ? "/icons/article-active.svg" : "/icons/article.svg"
                }
                className="h-full aspect-square"
                alt=""
              />
              {newPost && (
                <div className="absolute top-0 right-0 bg-[#3bbe95] text-white rounded-full w-1 h-1"></div>
              )}
            </>
          )}
        </NavLink>
        <NavLink to="/chat" className="w-7 h-7 relative">
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive
                    ? "/icons/chatbubbles-active.svg"
                    : "/icons/chatbubbles.svg"
                }
                className="h-full aspect-square"
                alt=""
              />
              {newChatCount && (
                <div className="absolute flex items-center justify-center top-[-3.5px] right-[-5.5px] bg-[#3bbe95] text-white rounded-full w-3.5 h-3.5 text-[11px]">
                  {newChatCount}
                </div>
              )}
            </>
          )}
        </NavLink>
        <NavLink to="/profile" className="w-7 h-7">
          {({ isActive }) =>
            isActive ? (
              <img
                src="/icons/profile-active.svg"
                className="h-full aspect-square"
                alt=""
              />
            ) : (
              <img
                src="/icons/profile.svg"
                className="h-full aspect-square"
                alt=""
              />
            )
          }
        </NavLink>
      </nav>
    </div>
  );
}
