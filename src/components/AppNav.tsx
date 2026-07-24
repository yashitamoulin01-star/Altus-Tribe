"use client";

import CardNav from "./CardNav";

export default function AppNav() {
  return (
    <div className="sticky top-2 z-50 pt-2 pb-2">
      {/* Top Header CardNav Integration */}
      <CardNav
        logo="/logo-light.png"
        logoAlt="Altus Tribe Logo"
        items={[
          {
            label: "Explore",
            bgColor: "#1F1B29",
            textColor: "#fff",
            links: [
              { label: "Members Directory", href: "/explore", ariaLabel: "Members Directory" },
              { label: "Sacred Space", href: "/sacred-space", ariaLabel: "Sacred Space" },
            ],
          },
          {
            label: "Campus",
            bgColor: "#2F293A",
            textColor: "#fff",
            links: [
              { label: "Programs & Courses", href: "/campus", ariaLabel: "Campus Programs" },
              { label: "Messages & Chat", href: "/messages", ariaLabel: "Messages" },
            ],
          },
          {
            label: "Account",
            bgColor: "#991b1b",
            textColor: "#fff",
            links: [
              { label: "Edit Feature", href: "/account/edit", ariaLabel: "Edit Feature" },
              { label: "Connections", href: "/connections", ariaLabel: "Connections" },
            ],
          },
        ]}
        baseColor="#120F17"
        menuColor="#ffffff"
        buttonBgColor="#ef4444"
        buttonTextColor="#ffffff"
        ctaText="Dashboard"
      />
    </div>
  );
}
