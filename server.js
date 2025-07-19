import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
const clientsByCode = new Map();

wss.on('connection', (ws) => {
    let code = null;

    const cleanUp = () => {
        if (code && clientsByCode.get(code) === ws) {
            clientsByCode.delete(code);
        }
    };

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }

        if (data.type === "code" && typeof data.code === "string") {
            code = data.code;

            if (clientsByCode.has(code)) {
                const peer = clientsByCode.get(code);
                clientsByCode.delete(code);

                peer.send(JSON.stringify({ type: "offerer" }));
                ws.send(JSON.stringify({ type: "answerer" }));

                const forward = (sender, receiver) => {
                    sender.on('message', (msg) => {
                        if (receiver.readyState === receiver.OPEN) {
                            receiver.send(msg);
                        }
                    });
                    sender.on('close', () => {
                        if (receiver.readyState === receiver.OPEN) {
                            receiver.send(JSON.stringify({ type: "disconnect" }));
                            receiver.close();
                        }
                    });
                };

                forward(peer, ws);
                forward(ws, peer);
            } else {
                clientsByCode.set(code, ws);
                ws.send(JSON.stringify({ type: "wait" }));
            }
        }
    });

    ws.on('close', cleanUp);
});
