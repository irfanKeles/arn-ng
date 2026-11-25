import type { CDPSession } from '@vitest/browser-playwright';
import { cdp, commands } from 'vitest/browser';
import { isChromium } from './browser';

// Used in tests only; not exported from any entry point. Real (trusted) mouse input, for states a
// synthetic event cannot reach (:active, a disabled button): through the Chrome DevTools Protocol
// in Chromium, through Playwright's page.mouse (the arnMouse browser command) in Firefox and
// WebKit (Playwright).

/** The center of the element in the coordinates of the top-level page (the test runs in a frame). */
function pagePoint(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  let x = rect.left + rect.width / 2;
  let y = rect.top + rect.height / 2;
  let view: Window | null = element.ownerDocument.defaultView;

  while (view?.frameElement) {
    const frame = view.frameElement.getBoundingClientRect();
    const scale = frame.width / view.innerWidth;

    x = frame.left + view.frameElement.clientLeft + x * scale;
    y = frame.top + view.frameElement.clientTop + y * scale;
    view = view.parent;
  }

  return { x, y };
}

// The Playwright provider's session (Chromium): `send` speaks the DevTools Protocol
const session = (): CDPSession => cdp();

type MouseType = 'mouseMoved' | 'mousePressed' | 'mouseReleased';

const COMMAND_TYPE = { mouseMoved: 'move', mousePressed: 'down', mouseReleased: 'up' } as const;

async function mouseAt(type: MouseType, x: number, y: number): Promise<void> {
  if (!isChromium) {
    await commands.arnMouse(COMMAND_TYPE[type], x, y);

    return;
  }

  await session().send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: type === 'mouseMoved' ? 'none' : 'left',
    buttons: type === 'mousePressed' ? 1 : 0,
    clickCount: type === 'mouseMoved' ? 0 : 1,
  });
}

async function mouse(type: MouseType, element: Element): Promise<void> {
  const { x, y } = pagePoint(element);

  await mouseAt(type, x, y);
}

/** Moves the mouse onto the element and presses the primary button; resolves the release. */
export async function pressAndHold(element: Element): Promise<() => Promise<void>> {
  await mouse('mouseMoved', element);
  await mouse('mousePressed', element);

  return async () => {
    await mouse('mouseReleased', element);
  };
}

/** Moves the mouse onto the element (real :hover). */
export async function moveOnto(element: Element): Promise<void> {
  await mouse('mouseMoved', element);
}

/** Moves the mouse below the element, off it, so its :hover ends. */
export async function moveOff(element: Element): Promise<void> {
  const { x, y } = pagePoint(element);
  const { height } = element.getBoundingClientRect();

  await mouseAt('mouseMoved', x, y + height * 4);
}
