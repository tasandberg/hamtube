const peerConnections = {}
const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"],
    },
  ],
}
// www.youtube.com/get_video_info?video_id={fOctS2INUvk}&el=detailpage
const socket = io.connect(window.location.origin)
const video = document.querySelector("video")

navigator.mediaDevices
  .getUserMedia({
    video: { facingMode: "user" },
    // Uncomment to enable audio
    audio: true,
  })
  .then((stream) => {
    video.srcObject = stream
    socket.emit("broadcaster")
  })
  .catch((error) => console.error(error))

// Next, we will create an RTCPeerConnection using the following code:
socket.on("watcher", (id) => {
  const peerConnection = new RTCPeerConnection(config)
  peerConnections[id] = peerConnection

  let stream = video.srcObject
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream))

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate)
    }
  }

  peerConnection
    .createOffer()
    .then((sdp) => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription)
    })
})

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description)
})

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
})
