import Peer from "simple-peer"

export default function (_chatComponent, socket, data) {
  const peerId = data.peerId
  const peer = new Peer({
    initiator: data.initiator,
    trickle: true,
    objectMode: true,
  })

  console.log(
    "Peer available for connection discovered from signalling server, Peer ID: %s",
    peerId
  )

  /* Handle receiving signal from new peer */
  socket.on("signal", (data) => {
    if (data.peerId === peerId) {
      console.log("Received signalling data from PeerId:", peerId)
      peer.signal(data.signal)
    }
  })

  /* Allow peer to handle receiving signal from this peer */
  /**
   * 1. This peer sends signal (automatic)
   * 2. Our instance of peerX here receives signal event
   * 3. Pass data through socket.io so that it is received by the other client
   */
  peer.on("signal", function (data) {
    console.log("Signal", data, "to Peer ID:", peerId)
    socket.emit("signal", {
      signal: data,
      peerId: peerId,
    })
  })
  peer.on("connect", function () {
    console.log("Peer connection established")
    peer.send("We made it")
  })

  peer.on("stream", function (stream) {
    socket.emit("stream", peerId, stream)
  })

  peer.on("data", (data) => {
    console.log(data)
  })

  return peer
}
