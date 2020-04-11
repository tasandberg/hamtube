const express = require("express")
const router = express.Router()
const chatRouter = express.Router({ mergeParams: true })

chatRouter.get("/new", (req, res) => {
  console.log(req, "REQUEST")
  res.send("fook yeah")
})
router.use("/chat", chatRouter)

module.exports = router
