const express = require("express");
const subdomain = require("express-subdomain");
const app = express();
// const bodyParser = require("body-parser")
const path = require("path");
const port = 4000;
const apiRouter = require("./routes/api");

app.use(express.static(path.join(__dirname, "build")));
const http = require("http");
const server = http.createServer(app);
require("./util/socket.js")(server);

if (process.env.NODE_ENV === "production") {
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
} else {
  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
}

app.use(subdomain("api", apiRouter));

server.listen(process.env.PORT || port, () =>
  console.log(`Server is running on port ${port}`)
);
