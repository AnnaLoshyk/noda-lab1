import {createForwardProxy} from './proxy.js';

const HOST = '0.0.0.0';
const PORT = 8080;


const server = createForwardProxy({
    debug: true
});

server.listen(PORT, HOST, () => {
    console.log(`Connection established on ${HOST}:${PORT}`);
});