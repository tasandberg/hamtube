import React from "react";
import KtvDashboard from "../pages/KtvDashboard";

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
];

const VideoBox = ({ id, muted }) => (
  <div className={`video-box`}>
    <div className="video-box-inner">
      <div className="video-box-video">
        <video autoPlay muted={muted} playsInline id={id}>
          asdfasdf
        </video>
      </div>
    </div>
  </div>
);

const EmptyBox = () => (
  <div className={`video-box`}>
    <div className="video-box-inner has-background-dark ">
      <div className="section">
        <h2 className="title has-text-white is-4">You're the only one here!</h2>
        <h3 className="subtitle">
          <button className="button is-primary">Invite some friends</button>
        </h3>
      </div>
    </div>
  </div>
);

export default ({ peers, userStream, stopVideo, startVideo, videoEnabled }) => {
  return (
    <div className="video-container has-background-dark">
      <div className="karaoke-container has-background-light">
        <KtvDashboard />
        <VideoBox key={"local-video-1"} id="local-video" muted={false} />
      </div>
      <div className="video-grid">
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
  );
};
