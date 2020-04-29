module.exports = {
  teardownKaraokeUserSocket: function (socket) {
    socket.removeAllListeners()
  },
  initKaraokeUserSocket: function (socket, karaokeRoom) {
    socket.on("player-ready", () => {
      if (karaokeRoom.songIsPlaying()) {
        karaokeRoom.playVideo(socket)
      } else {
        karaokeRoom.updateAwaitingClients(socket)
      }
    })

    socket.on("video-position", (data) => {
      karaokeRoom.videoPosition = data // Can we skip this?
      karaokeRoom.sendRoomData("room-data", { videoPosition: data })
    })

    socket.on("song-ended", () => {
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
      karaokeRoom.addToSongQueue(data, socket.id)
    })

    socket.on("disconnect", () => {
      karaokeRoom.removeUser(socket)
    })
  },
}
