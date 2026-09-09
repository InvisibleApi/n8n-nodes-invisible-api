export const AUTO_MEDIA_TYPE = 'auto';
export const EXPLICIT_MEDIA_TYPES = ['image', 'video'] as const;

const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm|avi|mpeg|mpg)$/i;

/**
 * Mirrors the dashboard's inference so both clients classify a URL the same
 * way. Extension-based, so a URL that ends in neither — a signed CDN link, for
 * example — falls back to image and needs the Media Type override. Expects a
 * valid absolute URL; callers validate first.
 */
export function inferMediaTypeFromUrl(url: string): 'image' | 'video' {
    return VIDEO_EXTENSIONS.test(new URL(url).pathname) ? 'video' : 'image';
}
