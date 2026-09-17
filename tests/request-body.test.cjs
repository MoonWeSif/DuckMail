const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../lib/request-body.ts'), 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, context);
const { parseRequestBody, updateRequestBody } = context.exports;

test('form edits preserve JSON-only fields, types and omitted fields', () => {
  let body = '{"address":"a@example.com","expiresIn":86400,"paused":false,"extra":{"tags":["a"]}}';
  body = updateRequestBody(body, 'address', '带引号"@example.com');
  body = updateRequestBody(body, 'expiresIn', -1);
  body = updateRequestBody(body, 'paused', true);
  assert.deepEqual(JSON.parse(body), {
    address: '带引号"@example.com', expiresIn: -1, paused: true, extra: { tags: ['a'] },
  });
  body = updateRequestBody(body, 'expiresIn', undefined);
  assert.equal(Object.hasOwn(JSON.parse(body), 'expiresIn'), false);
  body = updateRequestBody(body, 'expiresIn', 0);
  assert.equal(JSON.parse(body).expiresIn, 0);
  // A direct JSON edit is the source for the very next form change.
  body = '{"address":"from-json@example.com","label":"","paused":false}';
  body = updateRequestBody(body, 'label', 'From form');
  assert.equal(parseRequestBody(body).address, 'from-json@example.com');
  assert.equal(parseRequestBody(body).paused, false);
});

test('batch edits preserve sibling mailboxes and unknown data', () => {
  let body = JSON.stringify({ entries: [
    { address: 'a@example.com', protocol: 'auto', extra: 1 },
    { address: 'b@example.com', password: 'keep-me' },
  ], label: 'batch' });
  body = updateRequestBody(body, 'protocol', 'imap', 0);
  body = updateRequestBody(body, 'address', 'c@example.com', 1);
  assert.deepEqual(JSON.parse(body), { entries: [
    { address: 'a@example.com', protocol: 'imap', extra: 1 },
    { address: 'c@example.com', password: 'keep-me' },
  ], label: 'batch' });
  body = updateRequestBody(body, 'entries', []);
  assert.deepEqual(JSON.parse(body), { entries: [], label: 'batch' });
});

test('invalid and non-object JSON drafts are rejected without being overwritten', () => {
  for (const draft of ['', '{"address":', '{"a":1,}', 'null', '[]', '1', '"text"']) {
    assert.equal(parseRequestBody(draft), null);
    assert.equal(updateRequestBody(draft, 'address', 'replacement'), draft);
  }
  assert.notEqual(parseRequestBody('{}'), null);
  assert.equal(parseRequestBody('{"__proto__":{"polluted":true}}').polluted, undefined);
});
