/// <reference lib="webworker" />

import { domBrowser } from './dom-browser.ts';
import { type ConvertRequest, handleConvert } from './upload-protocol.ts';

/**
 * The conversion worker (docs/TECH.md 5). Wiring only — the contract is in
 * upload-protocol.ts and the work is in browser-image.ts, both testable
 * without a worker.
 */

self.onmessage = (event: MessageEvent<ConvertRequest>) => {
  void handleConvert(event.data, domBrowser()).then((response) => {
    self.postMessage(response);
  });
};
