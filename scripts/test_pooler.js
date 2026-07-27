const net = require('net');

const poolerHost = 'ep-bold-king-axacohp2-pooler.c-4.us-east-2.aws.neon.tech';
console.log('Testing connection to pooler host:', poolerHost);

const socket = net.connect(5432, poolerHost, () => {
  console.log('✅ Pooler Port 5432 TCP connection SUCCESSFUL!');
  socket.end();
});

socket.on('error', (e) => {
  console.error('Pooler Socket Error:', e.message);
});
