type PathAttributes = {
  d: string;
  fill?: string;
  stroke?: string;
  'stroke-width'?: string;
  'stroke-linejoin'?: string;
  'stroke-linecap'?: string;
};

function createSvgElement(paths: PathAttributes[]): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('height', '24');
    svg.setAttribute('width', '24');
    svg.setAttribute('focusable', 'false');
    svg.style.pointerEvents = 'none';
    svg.style.display = 'block';

    paths.forEach(pathAttrs => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        for (const [key, value] of Object.entries(pathAttrs)) {
            if (value) {
                path.setAttribute(key, value);
            }
        }
        svg.appendChild(path);
    });

    return svg;
}

export function createShareIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
      fill: 'var(--yt-spec-icon-active-other, #fff)',
    }
  ]);
}

export function createStrokedMessageIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M20 2H4a2 2 0 0 0-2 2v16l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z',
      fill: 'none',
      stroke: 'var(--yt-spec-icon-active-other, #fff)',
      'stroke-width': '1.5',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }
  ]);
}

export function createFilledMessageIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z',
      fill: 'var(--yt-spec-icon-active-other, #fff)',
    }
  ]);
}

export function createHeartIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.05.05-.05-.05C7.32 14.25 4 11.36 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.86-3.32 5.75-7.95 10.05z',
      fill: 'var(--yt-spec-icon-active-other, #fff)',
    }
  ]);
}

export function createBackArrowIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
      fill: 'var(--yt-spec-icon-active-other, #fff)',
    }
  ]);
}