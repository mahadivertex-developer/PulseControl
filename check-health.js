const http = require('http');

function request({ method, url, headers, body, timeout = 6000 }) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers, timeout }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, body: data });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

async function runChecks() {
  const checks = [];

  try {
    const frontend = await request({
      method: 'GET',
      url: 'http://localhost:3000',
    });
    const ok = frontend.statusCode >= 200 && frontend.statusCode < 500;
    checks.push({ name: 'Frontend (http://localhost:3000)', ok, detail: `status ${frontend.statusCode}` });
  } catch (error) {
    checks.push({ name: 'Frontend (http://localhost:3000)', ok: false, detail: error.message });
  }

  try {
    const backend = await request({
      method: 'GET',
      url: 'http://localhost:3002/api/docs',
    });
    const ok = backend.statusCode >= 200 && backend.statusCode < 500;
    checks.push({ name: 'Backend (http://localhost:3002/api/docs)', ok, detail: `status ${backend.statusCode}` });
  } catch (error) {
    checks.push({ name: 'Backend (http://localhost:3002/api/docs)', ok: false, detail: error.message });
  }

  try {
    const loginPayload = JSON.stringify({
      email: 'admin@example.com',
      password: 'password123',
    });

    const login = await request({
      method: 'POST',
      url: 'http://localhost:3002/api/auth/login',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload),
      },
      body: loginPayload,
    });

    let tokenFound = false;
    try {
      const parsed = JSON.parse(login.body || '{}');
      tokenFound = Boolean(parsed.token);
    } catch {
      tokenFound = false;
    }

    const ok = login.statusCode === 201 && tokenFound;
    checks.push({ name: 'Login API (/api/auth/login)', ok, detail: `status ${login.statusCode}` });
  } catch (error) {
    checks.push({ name: 'Login API (/api/auth/login)', ok: false, detail: error.message });
  }

  console.log('PulseControl health check');
  console.log('');

  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} - ${check.name} (${check.detail})`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    console.log('');
    console.log('Some checks failed. Start both services with: npm run dev');
    process.exit(1);
  }

  console.log('');
  console.log('All checks passed.');
}

runChecks().catch((error) => {
  console.error('Health check failed unexpectedly:', error.message);
  process.exit(1);
});
