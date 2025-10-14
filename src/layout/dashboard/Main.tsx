import { Outlet } from "react-router";
import Footer from "./Footer";

type Props = {
  drawerWidth: number;
};

function Main({ drawerWidth }: Props) {
  return (
    <main
      style={{ "--drawer-width": `${drawerWidth}px` } as React.CSSProperties}
      className="w-full flex-grow min-h-screen flex flex-col ml-0 sm:ml-[var(--drawer-width)]"
    >
      <div className="pt-16 sm:pt-20 pb-6 bg-background flex-1 min-h-screen overflow-x-hidden w-full">
        <Outlet />
      </div>
      <Footer />
    </main>
  );
}

export default Main;
