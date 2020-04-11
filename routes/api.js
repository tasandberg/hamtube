const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("api /");
});

router.post("/chat", (req, res) => {
  // create new chat and return
  res.send("abcd1234");
});

module.exports = router;
