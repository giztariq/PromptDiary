import indexHtml from '../../index.html?raw';
import manifestSource from '../../public/manifest.webmanifest?raw';
import robots from '../../public/robots.txt?raw';

function readIndexDocument(): Document {
  return new DOMParser().parseFromString(indexHtml, 'text/html');
}

describe('application metadata', () => {
  it('describes the app for search engines and social previews', () => {
    const document = readIndexDocument();
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const openGraphTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');

    expect(document.documentElement.lang).toBe('fr');
    expect(document.title).toContain('Prompt Diary');
    expect(description?.content).toContain('local-first');
    expect(themeColor?.content).toBe('#b45309');
    expect(openGraphTitle?.content).toBe('Prompt Diary');
    expect(document.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe(
      '/manifest.webmanifest',
    );
  });

  it('declares an installable manifest and allows indexing', () => {
    const manifest = JSON.parse(manifestSource) as {
      name: string;
      start_url: string;
      display: string;
      icons: Array<{ src: string; sizes: string }>;
    };

    expect(manifest.name).toBe('Prompt Diary');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);
    expect(robots).toContain('Allow: /');
  });
});
