import {createConnection, createServer} from 'node:net';

const HTTP_SPLITTER = '\r\n';
const HTTP_HEAD_SPLITTER = '\r\n\r\n';

const HTTP_CONNECT = 'CONNECT';
const HTTP_PROTOCOL = 'HTTP/1.1';
const HTTP_STATUS_OK = '200 Ok';
const HTTP_STATUS_INTERNAL = '500 Internal Server Error';
const HTTP_STATUS_BAD_REQUEST = '400 Bad Request';

/**
 * Create forward proxy server
 * @param options.debug {boolean} Enable debugging
 * */
export function createForwardProxy(options = {}) {
    const server = createServer();

    server.on('connection', socket => {
        socket.once('data', async buffer => {
            try {
                const head = parseHead(buffer);

                if (!head.headers.host) {
                    return socket.end(`${HTTP_PROTOCOL} ${HTTP_STATUS_BAD_REQUEST} ${HTTP_HEAD_SPLITTER}`);
                }

                const [hostname, port] = head.headers.host.split(':');

                if (!hostname) {
                    return socket.end(`${HTTP_PROTOCOL} ${HTTP_STATUS_BAD_REQUEST} ${HTTP_HEAD_SPLITTER}`);
                }

                if (options.debug) {
                    console.log(head);
                }

                const proxySocket = createConnection({host: hostname, port: port || 80});



                if (head.method === HTTP_CONNECT) {
                    socket.write(`${HTTP_PROTOCOL} ${HTTP_STATUS_OK} ${HTTP_HEAD_SPLITTER}`);
                } else {
                    proxySocket.write(buffer);
                }

                socket.pipe(proxySocket);
                proxySocket.pipe(socket);

                proxySocket.on('error', () => {
                    socket.end(`${HTTP_PROTOCOL} ${HTTP_STATUS_INTERNAL} ${HTTP_HEAD_SPLITTER}`);
                });

                socket.on('error', () => {
                    socket.end(`${HTTP_PROTOCOL} ${HTTP_STATUS_INTERNAL} ${HTTP_HEAD_SPLITTER}`);
                });
            } catch (e) {
                if (options.debug) {
                    console.error(e.stack);
                }
            }
        });
    });

    return server;
}

/*
* Parse a first socket message
* */
function parseHead(buffer) {
    const headers = {};

    const [head, ...rawHeaders] = buffer.toString().split(HTTP_HEAD_SPLITTER)[0].split(HTTP_SPLITTER);
    const [method, url, protocol] = head.split(' ');

    for (const rawHeader of rawHeaders) {
        if (!rawHeader) {
            continue;
        }

        const [key, ...values] = rawHeader.split(':');

        if (!key) {
            continue;
        }

        headers[key.toLowerCase().trim()] = values.join(':').trim();
    }

    return {
        method,
        protocol,
        headers,
        url,
    };
}