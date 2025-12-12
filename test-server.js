const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
            <head><title>Test Server</title></head>
            <body style="font-family: Arial; padding: 50px; background: #1a1d29; color: white;">
                <h1>✅ Server is Working!</h1>
                <p>If you see this, Node.js and HTTP server are working correctly.</p>
                <p>Port: 3000</p>
                <p>Now try the main server: <a href="http://localhost:3000" style="color: #667eea;">http://localhost:3000</a></p>
            </body>
        </html>
    `);
});

server.listen(3000, '0.0.0.0', () => {
    console.log('✅ Test server running on http://localhost:3000');
    console.log('If you see this message, Node.js is working!');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('❌ Port 3000 is already in use!');
        console.error('Please stop other servers or change the port.');
    } else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
});

