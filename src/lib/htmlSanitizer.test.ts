import { describe, expect, it } from 'vitest';
import { normalizeAndSanitizeArticleInput, sanitizeArticleHtml } from './htmlSanitizer';

describe('htmlSanitizer', () => {
  it('removes script and event handler payloads', () => {
    const dirty = '<h2>Hello</h2><img src=x onerror="alert(1)"><script>alert(2)</script>';
    const clean = sanitizeArticleHtml(dirty);

    expect(clean).toContain('<h2>Hello</h2>');
    expect(clean).not.toContain('onerror=');
    expect(clean).not.toContain('<script>');
  });

  it('converts bare image URLs and keeps safe img tags', () => {
    const raw = 'Read this https://images.example.com/photo.jpg now';
    const clean = normalizeAndSanitizeArticleInput(raw);

    expect(clean).toContain('<img');
    expect(clean).toContain('src="https://images.example.com/photo.jpg"');
  });

  it('removes javascript links', () => {
    const dirty = '<a href="javascript:alert(1)">Click me</a>';
    const clean = sanitizeArticleHtml(dirty);

    expect(clean).toContain('<a>Click me</a>');
    expect(clean).not.toContain('javascript:');
  });

  it('removes other dangerous URI schemes', () => {
    const payloads = [
      '<a href="vbscript:alert(1)">vbs</a>',
      '<a href="data:text/html,<script>alert(1)</script>">data</a>',
      '<a href="JavaScript:alert(1)">mixed case</a>',
    ];

    for (const dirty of payloads) {
      const clean = sanitizeArticleHtml(dirty);
      expect(clean).not.toMatch(/href\s*=/i);
    }
  });

  it('blocks null-byte and whitespace scheme obfuscation in href', () => {
    const payloads = [
      '<a href="java\u0000script:alert(1)">null</a>',
      '<a href="java\tscript:alert(1)">tab</a>',
    ];

    for (const dirty of payloads) {
      const clean = sanitizeArticleHtml(dirty);
      expect(clean).not.toMatch(/javascript/i);
      expect(clean).not.toMatch(/href\s*=\s*["']?[^"']*:/i);
    }
  });

  it('blocks protocol-relative URLs that hijack external origins', () => {
    const payloads = [
      '<a href="//evil.com/phish">phish</a>',
      '<a href="//attacker.com/steal">steal</a>',
    ];

    for (const dirty of payloads) {
      const clean = sanitizeArticleHtml(dirty);
      expect(clean).not.toMatch(/href\s*=/i);
      expect(clean).not.toContain('evil.com');
      expect(clean).not.toContain('attacker.com');
    }
  });

  it('keeps safe http(s), mailto, relative, and fragment links', () => {
    expect(sanitizeArticleHtml('<a href="https://example.com/x">ok</a>')).toContain(
      'href="https://example.com/x"'
    );
    expect(sanitizeArticleHtml('<a href="/article/slug">ok</a>')).toContain(
      'href="/article/slug"'
    );
    expect(sanitizeArticleHtml('<a href="#section">ok</a>')).toContain('href="#section"');
    expect(sanitizeArticleHtml('<a href="mailto:user@example.com">ok</a>')).toContain(
      'href="mailto:user@example.com"'
    );
  });
});
