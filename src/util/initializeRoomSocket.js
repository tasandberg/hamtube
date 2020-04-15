import io from "socket.io-client"
import initializePeer from "./peer"

export default ({ peers, setPeers, roomId, sharing, peerVids, stream }) => {
  const socket = io(`/?room=${roomId}`)

  console.log("Initializing socketio connection")
  const addPeer = (peer, peerId) => {
    setPeers({
      ...peers,
      [peerId]: {
        id: peerId,
        peer: peer,
        name: "",
        muted: false,
        volume: 1,
      },
    })
  }
  const removePeer = (peerId) => {
    delete peers[peerId]
    setPeers(peers)
  }

  socket.on("connect", (data) => {
    console.log("Connected to signalling server, Peer ID: %s", socket.id)

    /* On connect, we will send and receive data from all connected peers */
    socket.on("peer", (data) => {
      const peerId = data.peerId
      const peer = initializePeer({
        socket,
        data,
        peers,
        sharing,
        peerId,
        stream,
      })
      addPeer(peer, peerId)

      socket.on("destroy", (id) => {
        if (id === peerId) removePeer(id)
      })
    })
  })

  return socket
}
