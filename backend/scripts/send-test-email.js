'use strict';

const mailer = require('../services/mailer');

function usage() {
  console.log('Usage: TEST_EMAIL=you@example.com npm run mail:test');
}

async function main() {
  const to = (process.env.TEST_EMAIL || process.env.SMTP_TEST_TO || '').trim();
  if (!to) {
    usage();
    process.exit(1);
  }

  if (!mailer.isConfigured) {
    console.error('Mail service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env.');
    process.exit(1);
  }

  await mailer.sendTestEmail(to);
  console.log('Test email sent to ' + to.replace(/^(.{2}).*(@.*)$/, '$1***$2'));
}

main().catch((err) => {
  console.error('Test email failed:', {
    name: err?.name,
    message: err?.message,
    code: err?.code,
  });
  process.exit(1);
});
