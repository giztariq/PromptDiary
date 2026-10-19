import { useEffect, useRef } from 'react';

interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 24 }: LogoMarkProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!svgRef.current || !icon) return;

    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    const tokens = getComputedStyle(document.documentElement);
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
    svg.style.setProperty('--accent', tokens.getPropertyValue('--accent').trim());
    svg.style.setProperty('--surface', tokens.getPropertyValue('--surface').trim());
    icon.href = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
    >
      <rect width="24" height="24" rx="7" fill="var(--accent)" />
      <path d="M7 5.5h10v13l-5-3-5 3v-13Z" fill="var(--surface)" />
    </svg>
  );
}
