import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// A failed query of Testing Library prints the page; a limit keeps the report readable.
process.env.DEBUG_PRINT_LIMIT ??= '3000';

// jsdom has no layout engine. The flow library of the drawing area needs ResizeObserver to render, so a
// minimal stand-in is provided for component tests.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

// jsdom has no layout engine and does not scroll: a scroll into view is recorded, so a test can ask for it.
if (typeof Element !== 'undefined') {
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: vi.fn() });
}

// The flow library reads the zoom of the viewport with `DOMMatrixReadOnly`, which jsdom does not have.
// The viewport of the tests is never zoomed.
class DOMMatrixReadOnlyStub {
  m22 = 1;
}

vi.stubGlobal('DOMMatrixReadOnly', DOMMatrixReadOnlyStub);

// jsdom does not implement `showModal()` and `close()` of `<dialog>` completely.
// The stand-ins set and remove the attribute `open`; `close()` fires the event
// `close`. The lock on the rest of the page is shown by the browser test.
// The tests under `buildinfo/` run in Node.js without a DOM.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    if (!this.hasAttribute('open')) {
      return;
    }
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.stubGlobal('DOMMatrixReadOnly', DOMMatrixReadOnlyStub);
});
