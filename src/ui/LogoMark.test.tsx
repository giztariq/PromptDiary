import { render } from '@testing-library/react';

import indexHtml from '../../index.html?raw';
import { LogoMark } from './LogoMark';

describe('LogoMark', () => {
  it('keeps the decorative 24px logo and generates its favicon with the root CSS tokens', () => {
    const root = document.documentElement;
    const originalStyle = root.style.cssText;
    const icon = new DOMParser()
      .parseFromString(indexHtml, 'text/html')
      .querySelector<HTMLLinkElement>('link[rel="icon"]')!;
    expect(icon.getAttribute('type')).toBe('image/svg+xml');
    expect(icon.hasAttribute('href')).toBe(false);
    document.head.append(icon);
    const accent = 'rgb(12, 34, 56)';
    const surface = 'rgb(210, 220, 230)';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--surface', surface);

    try {
      const { container } = render(<LogoMark />);
      const logo = container.querySelector('svg')!;
      expect(logo).toHaveAttribute('width', '24');
      expect(logo).toHaveAttribute('height', '24');
      expect(logo).toHaveAttribute('viewBox', '0 0 24 24');
      expect(logo).toHaveAttribute('aria-hidden', 'true');
      expect(logo).toHaveAttribute('focusable', 'false');
      expect(logo.querySelector('rect')).toHaveAttribute('rx', '7');
      expect(logo.querySelector('rect')).toHaveAttribute('fill', 'var(--accent)');
      expect(logo.querySelector('path')).toHaveAttribute('d', 'M7 5.5h10v13l-5-3-5 3v-13Z');
      expect(logo.querySelector('path')).toHaveAttribute('fill', 'var(--surface)');

      const prefix = 'data:image/svg+xml,';
      expect(icon.href).toMatch(/^data:image\/svg\+xml,/);
      const faviconDocument = new DOMParser().parseFromString(
        decodeURIComponent(icon.href.slice(prefix.length)),
        'image/svg+xml',
      );
      expect(faviconDocument.querySelector('parsererror')).toBeNull();
      const favicon = faviconDocument.querySelector<SVGSVGElement>('svg')!;
      expect(favicon.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(favicon.style.getPropertyValue('--accent')).toBe(accent);
      expect(favicon.style.getPropertyValue('--surface')).toBe(surface);
      favicon.removeAttribute('xmlns');
      favicon.removeAttribute('style');
      expect(favicon.isEqualNode(logo)).toBe(true);
    } finally {
      icon.remove();
      root.style.cssText = originalStyle;
    }
  });
});
