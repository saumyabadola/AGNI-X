const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 5173,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:5173' }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(302, { Location: 'http://localhost:5173' + req.url });
    res.end();
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(5174, '127.0.0.1', () => {
  console.log('AGNI-X Port 5174 proxy listening -> 5173');
});
