import React from "react"
import _ from "lodash"
import getWebcam from "../util/getWebcam"
import initializeRoomSocket from "../util/initializeRoomSocket"

export default class Chat extends React.Component {
  constructor(props) {
    super(props)

    this.peerVids = {}
    this.state = {
      name: undefined,
      peers: {},
      sharing: false,
    }
  }

  componentDidMount() {
    console.log("Initializing client")
    this.socket = initializeRoomSocket()

    this.startLocalVideo()
  }

  startLocalVideo() {
    getWebcam()
      .then((stream) => {
        console.log("Local Video Obtained")

        this.localVideo.srcObject = stream
        this.stream = stream
      })
      .catch((e) => console.log(e))
  }

  setName = () => {
    this.socket.emit("set-name", this.nameBox.value)
    this.setState({
      name: this.nameBox.value,
    })
  }

  shareStream = () => {
    this.setState({
      sharing: true,
    })

    this.peerStream = this.stream.clone()

    Object.keys(this.state.peers).forEach((id) => {
      const { peer } = this.state.peers[id]
      peer.addStream(this.peerStream)
    })
  }

  stopStream = () => {
    this.setState({
      sharing: false,
    })

    // Disable the tracks of the stream
    this.peerStream.getTracks().forEach((t) => {
      t.enabled = false
    })

    // Tell peers to update their remote video streams
    this.socket.emit("disconnect-video")

    // Remove streams from peers
    _.forEach(this.state.peers, ({ id, peer }) => {
      peer.removeStream(this.peerStream)
    })

    // Send current peerStream to the collectors
    this.peerStream = null
  }

  toggleMute = (id) => {
    const el = this.peerVids[id]
    el.muted = !el.muted
  }

  render = () => (
    <section className="section">
      <div className="container">
        <h1 className="title">Video Chat</h1>
        {this.state.name ? (
          <h3>{this.state.name}</h3>
        ) : (
          <div>
            <input
              className="input"
              type="text"
              placeholder="Set name for chat"
              ref={(nameBox) => (this.nameBox = nameBox)}
            />
            <button onClick={this.setName}>Set Name</button>
          </div>
        )}
      </div>
      <div className="columns">
        <div className="column is-three-fifths">
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
            {Object.values(this.state.peers).map(({ id, muted }) => (
              <div key={`${id}-video`}>
                <button onClick={() => this.toggleMute(id)}>
                  {muted ? "unmute" : "mute"}
                </button>
                <video
                  autoPlay
                  className="has-background-black has-text-white"
                  muted={muted}
                  playsInline
                  id={`${id}-video`}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  ref={(video) => (this.peerVids[id] = video)}
                >
                  asdfasdf
                </video>
              </div>
            ))}
          </section>
        </div>
      </div>
      <button
        onClick={() =>
          this.state.sharing ? this.stopStream() : this.shareStream()
        }
      >
        {this.state.sharing ? "Stop Sharing" : "Share Video"}
      </button>{" "}
      {this.state.sharing ? (
        <span className="has-text-success">sharing</span>
      ) : null}
      <section className="section">
        <h1>Peer video</h1>
      </section>
    </section>
  )
}
