import React from "react"
import YouTube from "react-youtube"
import { extractVideoId } from "../util/youtube-data"
import classNames from "classnames"

const STATE_PLAYING = 1

class VideoPlayer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isPlaying: false,
      progress: 0,
    }
  }

  setPlaying() {
    setTimeout(() => {
      this.setState({ isPlaying: true })
    }, 2000)
  }

  updateProgress() {
    const currentTime = this.player.getCurrentTime()
    const duration = this.player.getDuration()
    this.setState({
      progress: (currentTime / duration) * 100,
    })
    setTimeout(() => {
      this.updateProgress()
    }, 200)
  }

  stateChange = (e) => {
    const { target, data } = e
    this.player = target
    this.updateProgress()
    if (data === STATE_PLAYING) this.setPlaying()
  }

  render() {
    const { resource } = this.props
    const videoId = extractVideoId(resource.url)

    return (
      <div className="video-container">
        <div
          className={classNames("video-overlay", {
            fade: this.state.isPlaying,
          })}
        >
          <div className="loading-text has-text-white">
            <center>
              <h1 className="title is-1 has-text-white">{resource.title}</h1>
              <span className="subtitle has-text-white">Get ready!</span>
            </center>
          </div>
        </div>
        <YouTube
          videoId={videoId}
          containerClassName="video-player"
          onStateChange={this.stateChange}
          onEnd={this.props.onEnd}
          muted={true}
          opts={{
            url: resource.url,
            playerVars: {
              controls: 0,
              modestbranding: 1,
              showinfo: 0,
              isMuted: true,
            },
            width: "100%",
            height: "100%",
          }}
          onReady={(e) => {
            console.log("video player ready")
            setTimeout(() => {
              e.target.playVideo()
            }, 2000)
          }}
        />
        <br />
        <progress
          className="progress is-primary"
          value={this.state.progress}
          max="100"
        ></progress>
      </div>
    )
  }
}

export default VideoPlayer
