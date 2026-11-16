/** Opens in a new tab: links off the site, and documents such as PDFs. */
export const opensNewTab = (href: string) => /^https?:/.test(href) || /\.pdf$/.test(href);

/** Attributes for `opensNewTab` links; base.css announces the new tab to screen readers. */
export const external = (href: string) => (opensNewTab(href) ? { target: '_blank', rel: 'noopener' } : {});
