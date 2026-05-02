/**
 * Run this on Render Shell to diagnose email issues:
 *   node test-email.js
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_PASS || '').trim();
const from = (process.env.EMAIL_FROM || user).trim();

console.log('--- Email Diagnostics ---');
console.log('EMAIL_USER :', user || '❌ NOT SET');
console.log('EMAIL_PASS :', pass ? `✅ SET (${pass.length} chars)` : '❌ NOT SET');
console.log('EMAIL_FROM :', from || '❌ NOT SET');
console.log('EMAIL_PORT :', process.env.EMAIL_PORT || '(default 587)');
console.log('-------------------------');

if (!user || !pass) {
  console.error('Cannot test — credentials missing. Set EMAIL_USER and EMAIL_PASS in Render env vars.');
  process.exit(1);
}

async function tryPort(port, secure) {
  console.log(`\nTrying port ${port} (secure=${secure})...`);
  const t = nodemailer.createTransport({
    host: 'smtp.gmail.com', port, secure,
    auth: { user, pass },
    connectionTimeout: 10000, socketTimeout: 10000
  });
  try {
    await t.verify();
    console.log(`✅ Port ${port} connection OK!`);
    const info = await t.sendMail({
      from, to: user,
      subject: `HCAP Email Test (port ${port})`,
      text: `If you see this, email from Render is working on port ${port}.`
    });
    console.log(`✅ Email sent! MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Port ${port} failed: [${err.code}] ${err.response || err.message}`);
    return false;
  }
}

(async () => {
  const ok587 = await tryPort(587, false);
  if (!ok587) await tryPort(465, true);
})();
