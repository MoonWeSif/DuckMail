const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

// Execute the actual refresh function without loading browser/UI dependencies.
const source = fs.readFileSync(path.join(__dirname, '../lib/api.ts'), 'utf8');
const parsed = ts.createSourceFile('api.ts', source, ts.ScriptTarget.Latest, true);
const fn = parsed.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === 'tryRefreshToken');
assert(fn, 'refresh function missing');
const js = ts.transpileModule('const refreshTokenPromises = new Map();\n' + fn.getText(parsed), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

test('API-key refresh is shared per account and cleared after success or failure', async () => {
  let calls = 0;
  let fail = false;
  const sandbox = {
    require: () => ({ exchangeHostedToken: async address => {
      calls++;
      await new Promise(resolve => setTimeout(resolve, 10));
      if (fail) throw new Error('test failure');
      return { token: `new-${address}` };
    }}),
    updateTokenInStorage() {},
    console: { error() {} },
  };
  vm.runInNewContext(js, sandbox);
  const account = address => ({ address, source: 'microsoft', loginMethod: 'apiKey' });
  const results = await Promise.all(Array.from({ length: 20 }, () => sandbox.tryRefreshToken(account('a'))));
  assert.equal(calls, 1);
  assert(results.every(token => token === 'new-a'));
  await Promise.all([sandbox.tryRefreshToken(account('a')), sandbox.tryRefreshToken(account('b'))]);
  assert.equal(calls, 3);
  fail = true;
  assert.equal(await sandbox.tryRefreshToken(account('a')), null);
  fail = false;
  assert.equal(await sandbox.tryRefreshToken(account('a')), 'new-a');
  assert.equal(calls, 5);
});

test('token refresh propagates a 429 cooldown instead of treating it as invalid credentials', async () => {
  let calls = 0;
  const limited = Object.assign(new Error('HTTP 429: Please retry later.'), {status: 429});
  const sandbox = {
    require: () => ({ exchangeHostedToken: async () => { calls++; throw limited; } }),
    updateTokenInStorage() { assert.fail('limited refresh must not replace token'); },
    console: { error() {} },
  };
  vm.runInNewContext(js, sandbox);
  const account = {address:'hosted@example.com',source:'microsoft',loginMethod:'apiKey'};
  await assert.rejects(sandbox.tryRefreshToken(account), e => e.status === 429);
  await assert.rejects(sandbox.tryRefreshToken(account), e => e.status === 429);
  assert.equal(calls, 2, 'completed failed promise must be removed');
});
