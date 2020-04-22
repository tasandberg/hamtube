import React, { Fragment } from "react"
import YouTube from "react-youtube"
import { extractVideoId } from "../util/youtube-data"
import classNames from "classnames"
import _ from "lodash"

class VideoPlayer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isPlaying: false,
      progress: 0,
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const currentVideoState = this.props.videoState

    if (currentVideoState !== prevProps.videoState) {
      switch (currentVideoState) {
        case YouTube.PlayerState.ENDED:
          this.player.stopVideo()
          break
        case YouTube.PlayerState.PLAYING:
          this.player.seekTo(this.props.videoPosition)
          this.player.playVideo()
          break

        default:
          break
      }
    }

    if (!_.isEqual(prevProps.videoData, this.props.videoData)) {
      console.log("New video: %s", prevProps.videoData)
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
    if (this.props.isLocalUser) {
      this.props.setCurrentTime(currentTime)
    } else {
      const positionOffset = Math.abs(currentTime - this.props.videoPosition)
      if (positionOffset > 0.5) {
        console.log("Video more that .5s out of sync. Syncing video...")

        this.player.seekTo(this.props.videoPosition)
      }
    }
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
  }

  onReady = (e) => {
    console.log("video player ready")
    this.player = e.target
    this.props.broadcastReady()
  }

  renderVideoPlayer(videoData, isLocalUser) {
    return (
      <Fragment>
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
          onEnd={() => isLocalUser && this.props.onEnd()}
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
      </Fragment>
    )
  }

  render() {
    const { videoData, isLocalUser } = this.props
    return (
      <div className="video-container">
        {videoData ? (
          this.renderVideoPlayer(videoData, isLocalUser)
        ) : (
          <span>TODO: Empty video state</span>
        )}
      </div>
    )
  }
}

export default VideoPlayer
