import React from "react"
import YouTube from "react-youtube"
import { extractVideoId } from "../util/youtube-data"
import classNames from "classnames"

class VideoPlayer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isPlaying: false,
      progress: 0,
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldVideoState = prevProps.videoState
    const videoState = this.props.videoState

    if (this.props.videoState !== oldVideoState && !this.props.isLocalUser) {
      console.log("video state change", videoState)
      if (videoState === YouTube.PlayerState.PLAYING) {
        this.player.playVideo()
      }
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
    this.props.setCurrentTime(currentTime)
    this.setState({
      progress: (currentTime / duration) * 100,
    })
    setTimeout(() => {
      this.updateProgress()
    }, 200)
  }

  stateChange = (e) => {
    const { data } = e

    this.updateProgress()
    if (data === YouTube.PlayerState.PLAYING) this.setPlaying()

    if (this.props.isLocalUser) {
      this.props.broadcast(data)
    }
  }

  onReady = (e) => {
    console.log("video player ready")
    this.player = e.target
    if (this.props.isLocalUser) {
      setTimeout(() => e.target.playVideo(), 2000)
    }
  }

  renderVideoPlayer(resource, isLocalUser) {
    const { videoData } = resource

    return (
      <div className="video-container">
        <div
          className={classNames("video-overlay", {
            fade: this.state.isPlaying,
          })}
        >
          <div className="loading-text has-text-white">
            <center>
              <h1 className="title is-1 has-text-white">{videoData.title}</h1>
              <span className="subtitle has-text-white">Get ready!</span>
            </center>
          </div>
        </div>
        <YouTube
          videoId={extractVideoId(videoData.url)}
          ref={(youtube) => (this.youtube = youtube)}
          containerClassName="video-player"
          onStateChange={this.stateChange}
          onEnd={this.props.onEnd}
          opts={{
            url: videoData.url,
            playerVars: {
              controls: 0,
              modestbranding: 1,
              showinfo: 0,
              mute: isLocalUser ? 0 : 1,
              autoplay: 0,
              disablekb: 1,
            },
            width: "100%",
            height: "100%",
          }}
          onReady={this.onReady}
        />
      </div>
    )
  }

  render() {
    const { resource, isLocalUser } = this.props
    return resource ? (
      this.renderVideoPlayer(resource, isLocalUser)
    ) : (
      <span>womp womp</span>
    )
  }
}

export default VideoPlayer
