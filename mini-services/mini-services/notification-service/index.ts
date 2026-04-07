import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3005;
const wss = new WebSocketServer({ port: PORT });

const clients = new Map<string, WebSocket>();

wss.on('connection', (ws) => {
  let userId = '';

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'auth' && msg.userId) {
        userId = msg.userId;
        clients.set(userId, ws);
        console.log(`User ${userId} connected`);
        // Send confirmation
        ws.send(JSON.stringify({ type: 'auth_success', userId }));
      }
      if (msg.type === 'notification' && msg.targetUserId) {
        const targetWs = clients.get(msg.targetUserId);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({ type: 'notification', data: msg.data }));
        }
      }
      if (msg.type === 'broadcast' && msg.data) {
        clients.forEach((clientWs) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'broadcast', data: msg.data }));
          }
        });
      }
    } catch (e) { /* ignore parse errors */ }
  });

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error: ${err.message}`);
  });
});

console.log(`Notification WebSocket service running on port ${PORT}`);
