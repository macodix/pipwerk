// Runs the browser tests without the backend: a fake backend in the browser answers the requests of the interface
// (src/testing/fakeApi.ts). The arguments go to `playwright test`, for example `npm run e2e:stub -- --project=chromium`.
// This is for the time until the backend of the branch speaks format 2.0; a report names the mode.
import { spawn } from 'node:child_process';

const child = spawn('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PIPWERK_STUDIO_E2E_STUB: '1' },
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
  process.exit(signal === null ? (code ?? 1) : 1);
});
