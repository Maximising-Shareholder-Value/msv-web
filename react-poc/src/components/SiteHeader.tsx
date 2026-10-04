// components/SiteHeader.tsx — the strip at the top of every React page: the ribbon
// (recommended links, the notification bell and the light/dark toggle) with the
// ticker search bar under it. The homepage has its own copy of these in HomePage.
// Shared here so every other page gets the same header.

import { HomeRibbon } from "./HomeRibbon";
import { HomeSearch } from "./HomeSearch";

export function SiteHeader() {
  return (
    <div className="site-header">
      <HomeRibbon />
      <HomeSearch />
    </div>
  );
}
