import React from "react"
import { List } from "immutable"
import { extractVideoData, extractVideoId } from "../util/youtube-data"

export default class KtvDashboard extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      songQueue: new List(),
      queueInputValue: "",
    }
  }

  addSong = (e) => {
    if (e.keyCode === 13) {
      const url = this.state.queueInputValue
      const id = extractVideoId(url)
      console.log("youtube video id", id)

      extractVideoData(id).then((response) => {
        console.log(response)
      })

      this.setState((prevState) => ({
        ...prevState,
        songQueue: prevState.songQueue.push(prevState.queueInputValue),
        queueInputValue: "",
      }))
    }
  }

  queueInputHandler = (e) => {
    console.log(e.currentTarget)

    this.setState({ queueInputValue: e.currentTarget.value })
  }
  render() {
    return (
      <section className="section">
        <div className="container">
          <div className="columns">
            <div className="column is-three-quarters">
              <h3 className="title is-4">Now Playing</h3>
            </div>
            <div className="column is-one-quarter">
              <h3 className="title is-4">Upcoming Songs</h3>
              <input
                className="input"
                type="text"
                value={this.state.queueInputValue}
                placeholder="Add a song!"
                onKeyDown={this.addSong}
                onChange={this.queueInputHandler}
                ref={(input) => (this.queueInput = input)}
              />
              <ul>
                {this.state.songQueue.map((song) => (
                  <li key={song}>{song}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
  }
}
