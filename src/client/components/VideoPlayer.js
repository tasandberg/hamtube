import React, { Fragment } from "react"
import YouTube from "react-youtube"
import { extractVideoId } from "../util/youtube-data"
import classNames from "classnames"
import _ from "lodash"
const debug = require("debug")("Hamtube:VideoPlayer")

class VideoPlayer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      hideOverlay: false,
      progress: 0,
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const currentVideoState = this.props.videoState
    if (!this.player) return
    if (currentVideoState !== prevProps.videoState) {
      debug("state change", currentVideoState)
      debug(YouTube.PlayerState.ENDED, "ENDED")

      switch (currentVideoState) {
        case YouTube.PlayerState.ENDED:
          debug("video player ended")
          this.hideOverlay(false)
          this.player.pauseVideo()
          break
        case YouTube.PlayerState.PLAYING:
          debug("video player playing")
          this.updateProgress()
          this.hideOverlay(true)
          this.player.seekTo(this.props.videoPosition)
          this.player.playVideo()
          break

        default:
          break
      }
    }

    if (!_.isEqual(prevProps.videoData, this.props.videoData)) {
      debug(prevProps.videoData, "prev")
      debug(this.props.videoData, "new")
    }
  }

  hideOverlay(hide) {
    setTimeout(() => {
      this.setState({ hideOverlay: hide })
    }, 2000)
  }

  updateProgress() {
    if (this.props.videoState !== YouTube.PlayerState.PLAYING) return

    const currentTime = this.player.getCurrentTime()
    const duration = this.player.getDuration()

    if (this.props.isLocalUser) {
      this.props.setCurrentTime(currentTime)
    } else {
      // add time since
      const { position, timeRecorded } = this.props.videoPosition

      // Get millis elapsed to receive position message
      const millisSincePosition = (Date.now() - timeRecorded) / 1000

      // Add millis to reported position
      const adjustedPosition = position + millisSincePosition

      // Calculate how off we are from reported position + millis elapsed
      const positionOffset = Math.abs(currentTime - position)

      // If greater than 500ms, sync to position + milliseconds since reporting
      if (positionOffset > 0.5) {
        debug("Video more that .5s out of sync. Syncing video...")

        this.player.seekTo(adjustedPosition)
      }
    }

    this.setState({
      progress: (currentTime / duration) * 100,
    })

    setTimeout(() => {
      this.updateProgress()
    }, 200)
  }

  onReady = (e) => {
    debug("video player ready")
    this.player = e.target
    this.props.broadcastReady()
  }

  renderVideoPlayer(videoData, isLocalUser) {
    return (
      <Fragment>
        <div
          className={classNames("video-overlay", {
            fade: this.state.hideOverlay,
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
        {videoData ? this.renderVideoPlayer(videoData, isLocalUser) : null}
      </div>
    )
  }
}

export default VideoPlayer
