import io from "socket.io-client"
import initializePeer from "./peer"

export default (parentComponent, roomId) => {
  const socket = io("/")
  console.log("Initializing socketio connection")
  socket.on("connect", () => {
    console.log("Connected to signalling server, Peer ID: %s", socket.id)

    /* On connect, we will send and receive data from all connected peers */
    socket.on("peer", (data) => {
      const peerId = data.peerId
      const peer = initializePeer(parentComponent, socket, data)

      parentComponent.setState((prevState) => ({
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

    socket.on("destroy", (id) => {
      parentComponent.setState((prevState) => {
        const peers = prevState.peers
        delete peers[id]
        return {
          peers: peers,
        }
      })
    })
  })

  return socket
}
