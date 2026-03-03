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
    addMeta("apple-mobile-web-app-title", "AXO OS");
    addLink("apple-touch-icon", "/icons/icon-192.png");
    addLink("manifest", "/admin-manifest.json");

    // Register service worker with /admin scope
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/admin-sw.js", { scope: "/admin" })
        .then((reg) => {
          console.log("[PWA] Service worker registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] SW registration failed:", err);
        });
    }

    return () => {
      elements.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
