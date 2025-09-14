const { exec } = require('child_process');

exec('npx playwright install', (err, stdout, stderr) => {
  if (err) {
    console.error('Playwright install error:', err);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});
