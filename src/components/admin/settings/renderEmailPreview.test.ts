import { describe, it, expect } from "vitest";
import { renderEmailPreviewBody } from "./renderEmailPreview";

/**
 * Guarantees the email preview renderer never breaks HTML when a template
 * variable (e.g. {{cta_link}}) appears inside an attribute like href="...".
 * The chip-highlighting <span> must only wrap variables that sit in text
 * content — never inside a tag's attribute value.
 */
describe("renderEmailPreviewBody — variables inside attributes", () => {
  const parse = (html: string) => {
    const doc = new DOMParser().parseFromString(
      `<!doctype html><html><body>${html}</body></html>`,
      "text/html"
    );
    return doc.body;
  };

  it("does not inject <span> chips inside href attribute values", () => {
    const body = `<a class="btn" href="{{cta_link}}">Schedule a Free Consultation</a>`;
    const out = renderEmailPreviewBody(body, ["cta_link"]);

    // No <span> snuck into the attribute / no broken markup like `}}">Schedule`.
    expect(out).not.toMatch(/href="[^"]*<span/);
    expect(out).not.toContain(`{{cta_link}}">`);

    const a = parse(out).querySelector("a.btn")!;
    expect(a).not.toBeNull();
    expect(a.getAttribute("href")).toBe("#");
    expect(a.textContent).toBe("Schedule a Free Consultation");
    // The anchor must contain exactly the CTA text — no leaked attribute soup.
    expect(a.innerHTML).toBe("Schedule a Free Consultation");
  });

  it("handles single-quoted attribute values", () => {
    const body = `<a href='{{cta_link}}'>Click</a>`;
    const out = renderEmailPreviewBody(body, ["cta_link"]);
    const a = parse(out).querySelector("a")!;
    expect(a.getAttribute("href")).toBe("#");
    expect(a.textContent).toBe("Click");
  });

  it("handles multiple variables across attributes and text", () => {
    const body = `<p>Hi {{name}},</p><a href="{{cta_link}}" data-tracking="{{utm}}">Book {{service}}</a>`;
    const out = renderEmailPreviewBody(body, ["name", "cta_link", "utm", "service"]);

    const root = parse(out);
    const a = root.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("#");
    expect(a.getAttribute("data-tracking")).toBe("#");

    // Text-content variables ARE wrapped in highlight chips.
    expect(root.querySelectorAll("span").length).toBe(2); // {{name}} + {{service}}
    expect(root.textContent).toContain("{{name}}");
    expect(root.textContent).toContain("{{service}}");
  });

  it("renders a valid <a> when href, target and class all contain variables", () => {
    const body = `<a class="btn-{{variant}}" target="{{target}}" href="{{cta_link}}">Go</a>`;
    const out = renderEmailPreviewBody(body, ["variant", "target", "cta_link"]);
    const a = parse(out).querySelector("a")!;
    expect(a).not.toBeNull();
    expect(a.getAttribute("href")).toBe("#");
    expect(a.getAttribute("target")).toBe("#");
    expect(a.getAttribute("class")).toBe("btn-#");
    expect(a.textContent).toBe("Go");
  });

  it("leaves plain HTML without variables untouched", () => {
    const body = `<p>Hello world</p>`;
    expect(renderEmailPreviewBody(body, [])).toBe(body);
  });
});
