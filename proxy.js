import http from "http";

const Server = http.createServer((incomingRequest, outgoingResponse) => {
  const destinationUrl = `http://www.testingmcafeesites.com/${incomingRequest.url}`;
  const options = new URL(destinationUrl);
  options.method = incomingRequest.method;
  options.headers = incomingRequest.headers;
  options.headers.host = "testingmcafeesites.com"; // Set the Host header

  const forwardedRequest = http.request(options, (remoteResponse) => {
    outgoingResponse.writeHead(
      remoteResponse.statusCode,
      remoteResponse.headers,
    );
    remoteResponse.pipe(outgoingResponse, {
      end: true,
    });
  });

  incomingRequest.pipe(forwardedRequest, {
    end: true,
  });

  forwardedRequest.on("error", (error) => {
    console.error("Request error:", error.message);
    outgoingResponse.writeHead(500, {
      "Content-Type": "text/plain",
    });
    outgoingResponse.end("Server Error");
  });
});

const SERVER_PORT = 8080;

Server.listen(SERVER_PORT, () => {
  console.log(`server on port: ${SERVER_PORT}`);
});
