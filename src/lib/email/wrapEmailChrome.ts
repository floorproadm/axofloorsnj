/**
 * Shared email chrome wrapper used by ALL email previews so what the user sees
 * in the UI matches what `gmail-send` actually delivers.
 *
 * Mirrors `wrapHtml` in `supabase/functions/gmail-send/index.ts` byte-for-byte
 * (header logo, gold border, footer). If you change one, change the other.
 *
 * Branding fallback: when callers don't pass a logo (e.g. Basic-plan tenants),
 * we render the company name as text in the header instead of the AXO logo.
 */
export interface EmailChromeOptions {
  logoUrl?: string | null;
  companyName?: string;
  companyLocation?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export function wrapEmailChrome(bodyHtml: string, opts: EmailChromeOptions = {}): string {
  const logoUrl = opts.logoUrl || "";
  const name = opts.companyName || "FloorPro";
  const location = opts.companyLocation || "";
  const phone = opts.companyPhone || "";
  const email = opts.companyEmail || "";

  const headerInner = logoUrl
    ? `<img src="${logoUrl}" alt="${name}" />`
    : `<span style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:0.5px">${name}</span>`;

  const footerParts = [name, location, phone].filter(Boolean).join(" · ");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;margin:0;padding:0;background:#fff}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.header{text-align:center;padding:24px 0;border-bottom:2px solid #8B6914}
.header img{max-height:56px;width:auto;display:inline-block}
.content{padding:24px 0}
.btn{display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0}
.footer{border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:12px;color:#999}
</style></head><body><div class="container">
<div class="header">${headerInner}</div>
<div class="content">${bodyHtml}</div>
<div class="footer">${footerParts}${email ? `<br>${email}` : ""}</div>
</div></body></html>`;
}
