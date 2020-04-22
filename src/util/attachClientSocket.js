import initializePeer from "./peer"
import io from "socket.io-client"

const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
}

export default function (parent) {
  const socket = io("/", { query: `room=${parent.roomId}` })
  parent.socket = socket

  // parent.startLocalVideo()

  socket.on("connect", () => {
    console.log("Connected to signalling server, Peer ID: %s", socket.id)

    /* On connect, we will send and receive data from all connected peers */
    socket.on("peer", (data) => {
      const peerId = data.peerId
      const peer = initializePeer(parent, socket, data)
      console.log("Peer added", peerId)

      parent.setState((prevState) => ({
        peers: {
          ...prevState.peers,
          [peerId]: {
            id: peerId,
            peer: peer,
            name: "",
            muted: false,
            volume: 1,
          },
        },
      }))
    })

    socket.on("room-data", (data) => {
      console.log(data, "room-data")
      const { currentSinger, currentSong, position, upNext } = data
      parent.setState({
        currentSinger: currentSinger,
        currentSong: currentSong || {},
        upNext: upNext,
        videoPosition: position || 0,
      })
    })

    socket.on("destroy", (id) => {
      parent.setState((prevState) => {
        const { peers, videoStreams } = prevState
        delete peers[id]
        delete videoStreams[id]
        return {
          peers,
          videoStreams,
        }
      })
    })

    socket.on("notification", (data) => {
      parent.setState({ notification: null })
      parent.setState({ notification: data.message })

      setTimeout(() => {
        if (parent.state.notification === data.message) {
          parent.setState({ notification: null })
        }
      }, 5000)
    })

    socket.on("song-added-success", (data) => {
      parent.setState({
        songInputNotification: data.message,
      })

      setTimeout(() => {
        parent.setState({
          songInputNotification: null,
        })
      }, 3000)
    })

    socket.on("video-control", (code) => {
      console.log("video-control", code)

      parent.setState({
        videoState: code,
      })
    })

    socket.on("video-position", (data) => {
      parent.setState({
        videoPosition: data,
      })
    })

    socket.on("new-song", ({ currentSong, currentSinger, upNext }) => {
      console.log(upNext, "up next")
      console.log(currentSinger, "currentSinger")
      console.log(currentSong, "currentSong")

      parent.setState({
        currentSong,
        currentSinger,
        upNext,
      })
    })
  })
}
