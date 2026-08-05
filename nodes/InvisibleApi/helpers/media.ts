export const AUTO_MEDIA_TYPE = 'auto';

const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm|avi|mpeg|mpg)$/i;

/**
 * Mirrors the dashboard's inference so both clients classify a URL the same
 * way. Extension-based, so a URL that ends in neither — a signed CDN link, for
 * example — falls back to image and needs the Media Type override.
 */
export function inferMediaTypeFromUrl(url: string): 'image' | 'video' {
	const pathname = (() => {
		try {
			return new URL(url).pathname;
		} catch {
			return url.split('?')[0].split('#')[0];
		}
	})();

	return VIDEO_EXTENSIONS.test(pathname) ? 'video' : 'image';
}
