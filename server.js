const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript"
};

http.createServer((request, response) => {
  const requestedFile = request.url === "/" ? "index.html" : request.url.slice(1);
  const filePath = path.join(root, requestedFile);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "text/plain"
    });
    response.end(data);
  });
}).listen(port, () => {
  console.log(`QuantPilot tracker running at http://localhost:${port}`);
});
