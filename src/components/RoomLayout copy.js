import React from "react"

const VideoBox = ({ id, muted, styleWidth }) => (
  <div className="video-grid-tile">
    <video autoPlay muted={muted} playsInline id={id}>
      asdfasdf
    </video>
  </div>
)

export default ({ peers, userStream, stopVideo, startVideo, videoEnabled }) => {
  const rows = Math.ceil(peers.length / 4)
  console.log(rows)
  console.log(peers)
  return (
    <div
      style={{ marginTop: "0px", flexWrap: "wrap", height: "100vh" }}
      className="container"
    >
      {/* Main Karaoke Video */}
      <div className="karaoke-container has-background-dark has-text-light">
        <div className="mock-video">Karaoke Video</div>
      </div>
      {/* Peer Videos Container Row 1*/}
      <div className="video-grid has-background-dark">
        <div className="video-grid-row">
          <VideoBox key={"local-video-1"} id="local-video" muted={false} />
          {peers.slice(0, 3).map((peer) => (
            <VideoBox
              key={peer.id}
              id={`${peer.id}-video`}
              muted={peer.muted}
            />
          ))}
        </div>
        {/* Peer Videos Container Row 2*/}
        {/* {rows > 1 ? (
          <div className="video-grid-row">
            {peers.slice(4, 8).map((peer) => (
              <VideoBox
                key={peer.id}
                id={`${peer.id}-video`}
                muted={peer.muted}
              />
            ))}
          </div>
        ) : null} */}
      </div>
    </div>
  )
}
