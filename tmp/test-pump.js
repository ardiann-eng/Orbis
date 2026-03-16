const WebSocket = require('ws');

const ws = new WebSocket('wss://pumpportal.fun/api/data');

ws.on('open', () => {
    console.log('Connected to Pumpportal');
    ws.send(JSON.stringify({
        method: "subscribeNewToken"
    }));
});

ws.on('message', (data) => {
    console.log('RAW EVENT:', data.toString());
});

ws.on('error', (err) => {
    console.error('WS Error:', err);
});
