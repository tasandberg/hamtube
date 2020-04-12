const express = require("express")
const subdomain = require("express-subdomain")
require("dotenv").config()
const app = express()
// const bodyParser = require("body-parser")
const path = require("path")
const port = 4000
const apiRouter = require("./routes/api")
const fs = require("fs")
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

if (process.env.NODE_ENV === "production") {
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"))
  })
} else {
  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "pgsublic", "index.html"))
  })
}

app.use(subdomain("api", apiRouter))
server.listen(process.env.PORT || port, "lvh.me", () =>
  console.log(`Server is running on port ${port}`)
)
