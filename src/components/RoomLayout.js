import React from "react"
import KtvDashboard from "../pages/KtvDashboard"

const colors = [
  "has-background-primary",
  "has-background-info",
  "has-background-warning",
  "has-background-danger",
  "has-background-success",
  // "has-background-primary",
  // "has-background-link",
  // "has-background-light",
  // "has-background-grey-light",
  // "has-background-primary",
  // "has-background-danger",
  // "has-background-success",
]

const VideoBox = ({ id, muted }) => (
  <div className={`video-box`}>
    <div className="video-box-inner">
      <div className="video-box-video">
        <video autoPlay={true} muted={muted} playsInline={true} id={id}>
          asdfasdf
        </video>
      </div>
    </div>
  </div>
)

const EmptyBox = () => (
  <div
    className={`video-box has-background-info`}
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <h2 className="title has-text-white">You're the only one here!</h2>
    <h3 className="subtitle">
      <button className="button is-primary">Invite some friends</button>
    </h3>
  </div>
)

export default ({ children, peers, currentSinger }) => {
  return (
    <div className="video-container has-background-dark">
      <div className="karaoke-container">
        <KtvDashboard>{children}</KtvDashboard>
        {currentSinger ? (
          <VideoBox
            key={currentSinger.id}
            id={`${currentSinger.id}-video`}
            muted={currentSinger.muted}
          />
        ) : (
          <div className="empty-current-singer has-text-white">
            <i
              className="fas fa-microphone fa-4x "
              style={{ marginBottom: "1rem" }}
            />
            <h3 className="title has-text-white">Add a song to get started</h3>
          </div>
        )}
      </div>
      <div className="video-grid">
        <VideoBox id="local-video" muted={true} />
        {peers.length > 0 ? (
          peers.map((peer) => (
            <VideoBox
              key={peer.id}
              id={`${peer.id}-video`}
              muted={peer.muted}
            />
          ))
        ) : (
          <EmptyBox />
        )}
      </div>
    </div>
  )
}
