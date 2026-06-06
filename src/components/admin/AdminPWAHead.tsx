import { useEffect } from "react";

export function AdminPWAHead() {
  useEffect(() => {
    const elements: HTMLElement[] = [];

    const addMeta = (name: string, content: string) => {
      const el = document.createElement("meta");
      el.setAttribute("name", name);
      el.setAttribute("content", content);
      document.head.appendChild(el);
      elements.push(el);
    };

    const addLink = (rel: string, href: string, attrs?: Record<string, string>) => {
      const el = document.createElement("link");
      el.setAttribute("rel", rel);
      el.setAttribute("href", href);
      if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      elements.push(el);
    };

    // Apple PWA meta tags
    addMeta("apple-mobile-web-app-capable", "yes");
    addMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    addMeta("apple-mobile-web-app-title", "FloorPRO");
    addLink("apple-touch-icon", "/icons/icon-192.png");
    addLink("manifest", "/admin-manifest.json");

    // Unregister any previously installed service worker and clear caches.
    // The old SW cached the /admin shell, which caused blank screens on iOS
    // PWA after deploys (cached HTML pointing to stale JS bundles).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          reg.unregister().catch(() => undefined);
        });
      }).catch(() => undefined);

      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k).catch(() => undefined));
        }).catch(() => undefined);
      }
    }

    return () => {
      elements.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
