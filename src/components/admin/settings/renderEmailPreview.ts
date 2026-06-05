/**
 * Renders an HTML preview of an email body template, highlighting unresolved
 * `{{variables}}` while keeping the markup valid.
 *
 * Variables that appear inside an HTML attribute value (e.g. `href="{{cta_link}}"`)
 * are NOT wrapped in a `<span>` chip — they would break the surrounding tag.
 * Instead they are replaced with `#` so links/buttons stay structurally valid in
 * the preview. Variables in text content are wrapped in a yellow chip so the
 * editor can see which tokens will be interpolated at send time.
 */
export function renderEmailPreviewBody(body: string, variables: string[]): string {
  // 1) Neutralize ANY {{var}} inside double-quoted attribute values.
  let html = body.replace(/="([^"]*)"/g, (_m, val) =>
    `="${val.replace(/\{\{[^}]+\}\}/g, "#")}"`
  );
  // 2) Also handle single-quoted attribute values (defensive).
  html = html.replace(/='([^']*)'/g, (_m, val) =>
    `='${val.replace(/\{\{[^}]+\}\}/g, "#")}'`
  );
  // 3) Wrap remaining (text-content) variables in highlight chips.
  for (const v of variables) {
    html = html
      .split(`{{${v}}}`)
      .join(
        `<span style="background:#fef3c7;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px">{{${v}}}</span>`
      );
  }
  return html;
}
