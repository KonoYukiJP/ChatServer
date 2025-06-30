import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
let waitingClient = null;

wss.on('connection', (ws) => {
	if (waitingClient === null) {
		waitingClient = ws;
		ws.send(JSON.stringify({ type: "wait" }));

		ws.on('close', () => {
			waitingClient = null;
		});
	} else {
		const offerer = waitingClient;
		const answerer = ws;
		waitingClient = null;

		offerer.send(JSON.stringify({ type: "offerer"}));
		answerer.send(JSON.stringify({ type: "answerer"}));

		const forward = (sender, receiver) => {
			sender.on('message', (message) => {
				if (receiver.readyState === receiver.OPEN) {
					receiver.send(message);
				}
			});
			sender.on('close', () => {
				if (receiver.readyState === receiver.OPEN) {
					receiver.close();
				}
			});
		};
		forward(offerer, answerer);
		forward(answerer, offerer);
	}
});
