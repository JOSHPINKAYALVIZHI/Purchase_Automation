const dns = require('dns');
const net = require('net');

const host = 'ep-bold-king-axacohp2.c-4.us-east-2.aws.neon.tech';
console.log('Resolving host:', host);

dns.lookup(host, (err, address, family) => {
  if (err) {
    console.error('DNS Lookup Error:', err);
    return;
  }
  console.log(`IP Address: ${address} (v${family})`);

  const socket = net.connect(5432, address, () => {
    console.log('✅ Port 5432 TCP connection SUCCESSFUL!');
    socket.end();
  });

  socket.on('error', (e) => {
    console.error('TCP Socket Error:', e);
  });
});
