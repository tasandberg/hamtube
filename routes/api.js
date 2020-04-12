const express = require("express");
const router = express.Router();
const chatRouter = express.Router({ mergeParams: true });
const db = require("../models/index.js");
const Chat = db.Chat;

chatRouter.get("/new", (req, res) => {
  Chat.create().then((c) => {
    console.log("Chat created");
    console.log(c);
    res.send(c.id);
  });
});
router.use("/chat", chatRouter);

module.exports = router;
