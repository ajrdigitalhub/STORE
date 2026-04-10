import {
  BootstrapContext,
  bootstrapApplication,
} from '@angular/platform-browser';
import {App} from './app/app';
import {config} from './app/app.config.server';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Shim __dirname for ESM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (globalThis as any).__dirname === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__dirname = dirname(fileURLToPath(import.meta.url));
}

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);

export default bootstrap;
