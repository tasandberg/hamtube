const express = require("express")
const subdomain = require("express-subdomain")
require("dotenv").config()
const app = express()
// const bodyParser = require("body-parser")
const path = require("path")
const port = process.env.PORT || 4000
const apiRouter = require("./routes/api")
const fs = require("fs")
const morgan = require("morgan")

// Logging
app.use(morgan("tiny"))

// Declare public static files
app.use(express.static(path.join(__dirname, "build")))

// CORS Headers
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  next()
})

let server
if (process.env.NODE_ENV === "development") {
  console.log("Starting development server with self-signed SSL Certificate")

  server = require("https").createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },
    app
  )
} else {
  console.log("Starting production server")
  server = require("http").createServer(app)
}

require("./util/socket.js")(server)

app.use(subdomain("api", apiRouter))

app.get("*", function (req, res) {
  let indexPath
  if (process.env.NODE_ENV === "production") {
    indexPath = path.join(__dirname, "build", "index.html")
  } else {
    indexPath = path.join(__dirname, "public", "index.html")
  }
  res.sendFile(indexPath)
})

server.listen(port, process.env.HOST, () =>
  console.log(`Server is running on port ${port}`)
)
