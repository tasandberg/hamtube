import React from "react"
import io from "socket.io-client"

// const config = {
//   iceServers: [
//     {
//       urls: ["stun:stun.l.google.com:19302"],
//     },
//   ],
// }

export default class Chat extends React.Component {
  componentDidMount() {
    console.log("Initializing client")
    const socket = io("http://localhost:4000")
    this.socket = socket
    socket.on("connect", () => {
      console.log(socket.id, "connected")
    })
    // this.startLocalVideo()

    socket.on("client-list", (data) => {
      console.log(data)
    })
  }

  startLocalVideo = () => {
    const options = {
      video: {
        facingMode: "user",
        width: { min: 160, ideal: 640, max: 1280 },
        height: { min: 120, ideal: 360, max: 720 },
      },
      audio: true,
    }
    navigator.mediaDevices
      .getUserMedia(options)
      .then((stream) => {
        this.localVideo.srcObject = stream
        this.socket.emit("broadcaster")
      })
      .catch((error) => console.error(error))
  }

  render = () => (
    <section className="section">
      <div className="container">
        <h1 className="title">Video Chat</h1>
      </div>
      <div className="columns">
        <div className="column is-four-fifths">
          <section className="section has-background-primary">
            <h2 className="title">Main Video</h2>
            <video
              autoPlay
              muted
              id="localVideo"
              ref={(video) => (this.localVideo = video)}
            />
          </section>
        </div>
        <div className="column">
          <section className="section has-background-light">
            <h2>Chat buddies</h2>
          </section>
        </div>
      </div>
    </section>
  )
}
