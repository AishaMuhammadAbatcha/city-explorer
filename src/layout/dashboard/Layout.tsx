import { useState } from "react";
import Main from "./Main";
import SideNav from "./SideNav";
import Header from "./Header";

function Layout() {
  const drawerWidth = 265;
  const collapsedWidth = 64; // Width when sidebar is collapsed
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Header
        drawerWidth={drawerWidth}
        collapsedWidth={collapsedWidth}
        handleDrawerToggle={handleDrawerToggle}
      />

      <SideNav
        drawerWidth={drawerWidth}
        handleDrawerToggle={handleDrawerToggle}
        mobileOpen={mobileOpen}
      />

      <Main drawerWidth={drawerWidth} collapsedWidth={collapsedWidth} />
    </div>
  );
}

export default Layout;
