/**
 * Shared email chrome wrapper used by ALL email previews so what the user sees
 * in the UI matches what `gmail-send` actually delivers.
 *
 * Mirrors `wrapHtml` in `supabase/functions/gmail-send/index.ts` byte-for-byte
 * (header logo, gold border, footer). If you change one, change the other.
 */
const DEFAULT_EMAIL_LOGO =
  "https://dcfmrqrbsfxvqhihpamd.supabase.co/storage/v1/object/public/feed-media/brand/axo-logo-email.png?v=2";

export interface EmailChromeOptions {
  logoUrl?: string | null;
  companyName?: string;
  companyLocation?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export function wrapEmailChrome(bodyHtml: string, opts: EmailChromeOptions = {}): string {
  const logoUrl = opts.logoUrl || DEFAULT_EMAIL_LOGO;
  const name = opts.companyName || "AXO Floors";
  const location = opts.companyLocation || "New Jersey";
  const phone = opts.companyPhone || "(732) 351-8653";
  const email = opts.companyEmail || "axofloorsnj@gmail.com";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;margin:0;padding:0;background:#fff}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.header{text-align:center;padding:24px 0;border-bottom:2px solid #8B6914}
.header img{max-height:56px;width:auto;display:inline-block}
.content{padding:24px 0}
.btn{display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0}
.footer{border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:12px;color:#999}
</style></head><body><div class="container">
<div class="header"><img src="${logoUrl}" alt="${name}" /></div>
<div class="content">${bodyHtml}</div>
<div class="footer">${name} · ${location} · ${phone}<br>${email}</div>
</div></body></html>`;
}
