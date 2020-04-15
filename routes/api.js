const express = require("express")
const router = express.Router()
const chatRouter = express.Router({ mergeParams: true })
const db = require("../models/index.js")
const Chat = db.Chat

chatRouter.get("/new", (req, res) => {
  Chat.create().then((c) => {
    res.json({ id: c.id })
  })
})

chatRouter.get("/:chatId", (req, res) => {
  Chat.findByPk(req.params.chatId)
    .then((data) => {
      if (data) {
        res.json({ chat: data })
      } else {
        console.log(data)
        console.log("chat not found")
        res.status(404).json({ error: "Room not found" })
      }
    })
    .catch((e) => {
      res.status(404).json({ error: "Room not found" })
    })
})

router.use("/chat", chatRouter)

module.exports = router
