import Peer from "simple-peer"

export default function ({ socket, data, sharing, peers, peerId, stream }) {
  const socketId = socket.id

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
    if (data.peerId === peerId && peers[peerId]) {
      if (!peer.destroyed) {
        peer.signal(data.signal)
      }
    }
  })

  /* Allow peer to handle receiving signal from this peer */
  /**
   * 1. This peer sends signal (automatic)
   * 2. Our instance of peerX here receives signal event
   * 3. Pass data through socket.io so that it is received by the other client
   */
  peer.on("signal", function (data) {
    socket.emit("signal", {
      signal: data,
      peerId: peerId,
    })
  })

  peer.on("connect", function () {
    if (sharing) {
      console.log(sharing, "sharing " + socketId)

      peer.addStream(stream)
    }
    peer.send("Hello from " + socket.id)
  })

  socket.on("disconnect-video", (socketId) => {
    const vid = document.getElementById(`${socketId}-video`)
    if (vid) {
      vid.srcObject = null
    }
  })

  peer.on("stream", function (stream) {
    console.log("Im getting a stream so hard rn")
    console.log("My id", socketId)
    console.log("Peer id", peerId)
    const vid = document.getElementById(`${peerId}-video`)

    vid.srcObject = stream
  })

  peer.on("data", (data) => {
    console.log(data)
  })

  peer.on("destroy", () => {
    console.log("destroy")

    socket.emit("destroy", peerId)
  })

  return peer
}
