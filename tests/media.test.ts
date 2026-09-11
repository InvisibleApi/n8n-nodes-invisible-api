import { describe, expect, it } from 'vitest';

import { inferMediaTypeFromUrl } from '../nodes/InvisibleApi/helpers/media';

describe('inferMediaTypeFromUrl', () => {
    it('classifies video extensions as video', () => {
        expect(inferMediaTypeFromUrl('https://cdn.example.com/clip.mp4')).toBe('video');
        expect(inferMediaTypeFromUrl('https://cdn.example.com/clip.MOV')).toBe('video');
    });

    it('classifies image extensions as image', () => {
        expect(inferMediaTypeFromUrl('https://cdn.example.com/photo.jpg')).toBe('image');
    });

    it('ignores query strings and fragments when matching the extension', () => {
        expect(inferMediaTypeFromUrl('https://cdn.example.com/clip.mp4?signature=abc')).toBe('video');
        expect(inferMediaTypeFromUrl('https://cdn.example.com/clip.mp4#t=10')).toBe('video');
    });

    it('falls back to image when the path carries no known extension', () => {
        expect(inferMediaTypeFromUrl('https://cdn.example.com/signed-download')).toBe('image');
    });
});
