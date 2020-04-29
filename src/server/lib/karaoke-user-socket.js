const debug = require("debug")("KaraokeUserSocket")
module.exports = {
  teardownKaraokeUserSocket: function (socket) {
    socket.removeAllListeners()
  },
  initKaraokeUserSocket: function (socket, karaokeRoom) {
    socket.on("player-ready", () => {
      debug("Player-Ready received from %s", socket.id)
      if (karaokeRoom.songIsPlaying()) {
        karaokeRoom.playVideo(socket)
      } else {
        karaokeRoom.updateAwaitingClients(socket)
      }
    })

    socket.on("video-position", (data) => {
      if (
        karaokeRoom.nowPlaying &&
        karaokeRoom.nowPlaying.singerId === socket.id
      ) {
        socket.to(karaokeRoom.id).emit("video-position", data)
      }
    })

    socket.on("song-ended", () => {
      debug("Song-ended received from %s", socket.id)

      // Only Take action if received from current singer
      if (
        karaokeRoom.nowPlaying &&
        karaokeRoom.nowPlaying.singerId === socket.id
      ) {
        console.log("Song ended, cycling queue...")
        karaokeRoom.stopVideo()
        karaokeRoom.cycleSongs()
      }
    })

    socket.on("add-song", (data) => {
      debug("Add-song received from %s", socket.id)

      karaokeRoom.addToSongQueue(data, socket.id)
    })

    socket.on("disconnect", () => {
      debug("Disconnect received from %s", socket.id)

      karaokeRoom.removeUser(socket)
    })
  },
}
