const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.resolve(
  repoRoot,
  'skills',
  'download-swagger-file',
  'scripts',
  'download.js'
);

function runCli(args, options = {}) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [scriptPath, ...args],
      { cwd: repoRoot, ...options },
      (error, stdout, stderr) => {
        resolve({
          error,
          stdout,
          stderr,
          code: error ? error.code : 0
        });
      }
    );
  });
}

function extractJson(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const jsonLine = [...lines].reverse().find((line) => line.startsWith('{'));
  return jsonLine ? JSON.parse(jsonLine) : null;
}

function startServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

test('fails when URL is missing', async () => {
  const result = await runCli([]);
  expect(result.code).toBe(1);
  const json = extractJson(result.stderr);
  expect(json).toEqual(
    expect.objectContaining({ success: false, code: 'MISSING_URL' })
  );
});

test('fails when URL is invalid', async () => {
  const result = await runCli(['not-a-url']);
  expect(result.code).toBe(1);
  const json = extractJson(result.stderr);
  expect(json).toEqual(
    expect.objectContaining({ success: false, code: 'INVALID_URL' })
  );
});

test('downloads and writes file', async () => {
  const { server, url } = await startServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"openapi":"3.0.0","info":{}}');
  });

  const tempDir = fs.mkdtempSync(
    path.join(repoRoot, 'tests', '.tmp-download-swagger-')
  );
  const outputPath = path.join(tempDir, 'openapi.json');

  try {
    const result = await runCli([`${url}/spec`, outputPath]);
    expect(result.code).toBe(0);
    const json = JSON.parse(result.stdout.trim());
    expect(json).toEqual(
      expect.objectContaining({ success: true, filePath: outputPath })
    );
    expect(fs.existsSync(outputPath)).toBe(true);
  } finally {
    await closeServer(server);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('fails for HTML content type', async () => {
  const { server, url } = await startServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html></html>');
  });

  try {
    const result = await runCli([`${url}/html`]);
    expect(result.code).toBe(1);
    const json = extractJson(result.stderr);
    expect(json).toEqual(
      expect.objectContaining({ success: false, code: 'INVALID_FORMAT' })
    );
  } finally {
    await closeServer(server);
  }
});
