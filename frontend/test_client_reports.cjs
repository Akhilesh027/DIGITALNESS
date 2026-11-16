// Runs without a browser, network, or database; uses the application's real PDF libraries.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync(`${__dirname}/src/components/client-portal/ClientReports.tsx`, 'utf8').replace('import.meta.env.VITE_API_URL', 'undefined');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, require: name => name.startsWith('@/') ? { Button: props => React.createElement('button', props), Input: props => React.createElement('input', props), authHeaders: () => ({}) } : require(name), URL, console, setTimeout });
const { normalize, createClientReportPDF, default: ClientReports } = exportsObject;
const period = { fromDate: '2026-11-08', toDate: '2026-11-14' };
const fixture = { report: { type: 'weekly', customer: { name: 'Test Client' }, period, summary: { updates: 1, hours: 2.5 }, rows: [{ date: '2026-11-10', task: 'Approved poster', employee: 'Test Employee', status: 'Completed', approval: 'Approved', hours: 2.5, completed: 'Poster delivered', pending: '', blockers: '', next: 'Plan next post' }] } };

test('preview normalization and real PDF share client, dates, totals and activity', () => {
  const report = normalize(fixture, 'weekly', 'ignored', period);
  const pdf = createClientReportPDF(report).output();
  assert.ok(pdf.startsWith('%PDF-'));
  for (const text of ['Weekly Client Report', 'Test Client', '2026-11-08', '2026-11-14', '2.5', 'Approved poster', 'Poster delivered', 'Plan next post']) assert.ok(pdf.includes(text), `PDF includes ${text}`);
});

test('empty report produces a valid PDF with explicit empty state; malformed data fails', () => {
  const report = normalize({ report: { ...fixture.report, rows: [], summary: { updates: 0, hours: 0 } } }, 'weekly', 'ignored', period);
  assert.ok(createClientReportPDF(report).output().includes('No activity recorded for this period.'));
  assert.throws(() => normalize({ data: null }, 'daily', 'Client', period));
});

test('long activity reports paginate and retain the last row', () => {
  const report = normalize(fixture, 'weekly', 'ignored', period);
  report.rows = Array.from({ length: 120 }, (_, index) => [`2026-11-10`, `Task ${index}`, 'Completed', '2.5', 'Delivered', 'None']);
  const pdf = createClientReportPDF(report);
  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(pdf.output().includes('Task 119'));
});

test('report cards and selector initially agree; missing customer disables generation', () => {
  const html = renderToStaticMarkup(React.createElement(ClientReports, { customerId: '', initialType: 'weekly' }));
  assert.match(html, /aria-pressed="true">Weekly Report/);
  assert.match(html, /value="weekly" selected/);
  assert.match(html, /disabled="">Generate Preview/);
});
