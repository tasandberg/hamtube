const express = require("express")
const app = express()
// const bodyParser = require("body-parser")
const path = require("path")
const port = 4000

app.use(express.static(path.join(__dirname, "build")))
const http = require("http")
const server = http.createServer(app)
require("./util/socket.js")(server)
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

server.listen(port, () => console.log(`Server is running on port ${port}`))
