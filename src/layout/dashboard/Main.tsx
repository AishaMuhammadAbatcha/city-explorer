import { Outlet } from "react-router";
import Footer from "./Footer";

type Props = {
  drawerWidth: number;
};

function Main({ drawerWidth }: Props) {
  return (
    <main
      style={{ "--drawer-width": `${drawerWidth}px` } as React.CSSProperties}
      className="w-full sm:w-[calc(100%_-_var(--drawer-width))] sm:ml-[var(--drawer-width)] flex-grow min-h-screen flex flex-col"
    >
      <div className="pt-16 sm:pt-20 pb-6 bg-background flex-1 min-h-screen">
        <Outlet />
      </div>
      <Footer />
    </main>
  );
}

export default Main;
