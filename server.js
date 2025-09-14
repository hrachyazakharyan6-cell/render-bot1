const http = require('http');
const { spawn } = require('child_process');

// spawn cgi.js from this folder
const child = spawn('node', ['cgi.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('error', err => console.error('cgi.js spawn error:', err));
child.on('exit', (code, sig) => console.log(`cgi.js exited: code=${code}, sig=${sig}`));

// tiny HTTP server so Render thinks this is a web service
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Health server listening on ${PORT}`));
