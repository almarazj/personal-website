/** Attributes that open external links in a new tab; base.css announces it to screen readers. */
export const external = (href: string) => (/^https?:/.test(href) ? { target: '_blank', rel: 'noopener' } : {});
