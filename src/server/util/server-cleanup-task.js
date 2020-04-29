const debug = require("debug")("RoomCleanupTask")
const moment = require("moment")
const Room = require("../../../models/index").Room
const { gte } = require("sequelize").Op

const HOURS_TO_TIMEOUT = 3
function getAbandonedRooms() {
  const cutOff = moment().subtract(HOURS_TO_TIMEOUT, "hours")
  const where = {
    abandonedAt: {
      [gte]: cutOff,
    },
  }
  return Room.findAll({ where })
}

const roomCleanup = () => {
  const abandonedRooms = getAbandonedRooms()
  debug(abandonedRooms)
}

roomCleanup()
