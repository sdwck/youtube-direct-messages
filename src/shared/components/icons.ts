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

export function createSettingsIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z',
      fill: 'var(--yt-spec-icon-active-other, #fff)',
    }
  ]);
}

export function createMoreVertIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      fill: 'var(--yt-spec-icon-active-other, #fff)',
    }
  ]);
}

export function createCloseIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
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

export function createBackArrowIcon(): SVGElement {
  return createSvgElement([
    {
      d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
      fill: 'var(--yt-spec-icon-active-other, #fff)',
    }
  ]);
}