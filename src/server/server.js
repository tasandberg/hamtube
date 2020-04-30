const express = require("express")
const subdomain = require("express-subdomain")
const app = express()
// const bodyParser = require("body-parser")
const path = require("path")
require("dotenv").config()
const port = process.env.PORT || 4000
const apiRouter = require("../../routes/api")
const fs = require("fs")
const morgan = require("morgan")
const debug = require("debug")("Express")

// Logging
app.use(morgan("tiny"))

// Declare public static files
app.use(express.static(path.join(process.cwd(), "build")))

// CORS Headers
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  next()
})

let server
if (process.env.NODE_ENV === "development") {
  debug("Starting development server with self-signed SSL Certificate")

  server = require("https").createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },
    app
  )
} else {
  debug("Starting production server")
  server = require("http").createServer(app)
}

require("./util/socket.js")(server)

app.use(subdomain("api", apiRouter))

app.get("*", function (req, res) {
  let indexPath

  if (process.env.NODE_ENV === "production") {
    indexPath = path.join(process.cwd(), "build", "index.html")
  } else {
    indexPath = path.join(process.cwd(), "public", "index.html")
  }
  res.sendFile(indexPath)
})

server.listen(port, process.env.HOST, () =>
  debug(`Server is running on port ${port}`)
)

debug("Kicking off recurring tasks")
require("./util/rooms-cleanup-task")()
