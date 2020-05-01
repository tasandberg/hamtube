const debug = require("debug")("RoomCleanupTask")
const moment = require("moment")
const Room = require("../../../models/index").Room
const { lte } = require("sequelize").Op

const ROOM_TIMEOUT_HOURS = 3
const TASK_RUN_INTERVAL_HOURS = 3
function getAbandonedRooms() {
  const cutOff = moment().subtract(ROOM_TIMEOUT_HOURS, "hours").toISOString()
  const where = {
    abandonedAt: {
      [lte]: cutOff,
    },
  }
  return Room.findAll({ where }).catch((e) => {
    debug(e)
    return []
  })
}

const roomCleanup = async () => {
  debug("Cleaning up rooms")
  const abandonedRooms = await getAbandonedRooms()
  const roomCount = abandonedRooms.length
  debug(roomCount, "rooms found")

  if (roomCount === 0) return
  Promise.all(abandonedRooms.map((room) => room.destroy()))
    .then(() => {
      debug("%s stale rooms cleaned up.", abandonedRooms.lenth)
      debug("Sleeping task for %s hours", TASK_RUN_INTERVAL_HOURS)
    })
    .catch((e) => {
      debug("Error occurred")
      debug(e)
    })
}

const recurringTask = () => {
  roomCleanup() // run once at startup
  setInterval(roomCleanup, TASK_RUN_INTERVAL_HOURS * 60 * 60 * 1000)
}

module.exports = recurringTask
