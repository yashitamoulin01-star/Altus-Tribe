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
            label: "Tribe",
            bgColor: "var(--color-surface-sunk)",
            textColor: "var(--color-ink)",
            links: [
              { label: "Connect with Participants", href: "/explore", ariaLabel: "Connect with Participants" },
              { label: "Sacred Space", href: "/sacred-space", ariaLabel: "Sacred Space" },
            ],
          },
          {
            label: "Campus",
            bgColor: "var(--color-surface-sunk)",
            textColor: "var(--color-ink)",
            links: [
              { label: "Programs & Courses", href: "/campus", ariaLabel: "Campus Programs" },
              { label: "Messages & Chat", href: "/messages", ariaLabel: "Messages" },
            ],
          },
          {
            label: "Account",
            bgColor: "var(--color-red)",
            textColor: "#ffffff",
            links: [
              { label: "Edit Feature", href: "/account/edit", ariaLabel: "Edit Feature" },
              { label: "Connections", href: "/connections", ariaLabel: "Connections" },
            ],
          },
        ]}
        baseColor="var(--color-paper)"
        menuColor="var(--color-ink)"
        buttonBgColor="var(--color-red)"
        buttonTextColor="#ffffff"
        ctaText="Dashboard"
      />
    </div>
  );
}
