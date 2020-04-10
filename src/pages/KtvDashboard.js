import React from "react";
import { List } from "immutable";
import { extractVideoData, validUrl } from "../util/youtube-data";
// https://www.youtube.com/watch?v=KUl7nLhM7UY
export default class KtvDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songQueue: new List(),
      queueInputValue: "",
      linkPreview: null,
    };
  }

  addSong = (e) => {
    if (e.keyCode === 13) {
      const url = this.state.queueInputValue;

      extractVideoData(url).then(({ data }) => {
        console.log(data);

        this.setState((prevState) => ({
          ...prevState,
          songQueue: prevState.songQueue.push(data),
          queueInputValue: "",
          linkPreview: null,
        }));
      });
    }
  };

  setLinkPreview(url) {
    extractVideoData(url).then((response) => {
      const { error, data } = response;
      if (data.error) {
        console.log(error);
        this.setState({ linkPreview: null });
      } else if (data.thumbnail_url || data.title) {
        this.setState({ linkPreview: data });
      }
    });
  }

  queueInputHandler = (e) => {
    const value = e.currentTarget.value;

    if (validUrl(value)) {
      this.setLinkPreview(value);
    } else {
      this.setState({ linkPreview: null });
    }

    this.setState({ queueInputValue: e.currentTarget.value });
  };

  removeQueueSong = (i) => {
    this.setState((prevState) => ({
      ...prevState,
      songQueue: prevState.songQueue.delete(i),
    }));
  };

  render() {
    const { songQueue, linkPreview } = this.state;

    return (
      <section className="section">
        <div className="container">
          <div className="columns">
            <div className="column is-two-thirds"></div>
            <div className="column is-one-thirdr">
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
              <hr />
              {songQueue.map((song, i) => (
                <article className="media" key={`${song}-${i}`}>
                  <figure className="media-left">
                    <p className="image is-64x64">
                      <img alt="video preview" src={song.thumbnail_url} />
                    </p>
                  </figure>
                  <div className="media-content">
                    <div className="content">{song.title}</div>
                  </div>
                  <div className="media-right">
                    <button
                      className="delete"
                      onClick={() => this.removeQueueSong(i)}
                    />
                  </div>
                </article>
              ))}
              {linkPreview ? (
                <article
                  className="media"
                  key={`${linkPreview.title}-preview`}
                  style={{ opacity: "0.5" }}>
                  <figure className="media-left">
                    <p className="image is-64x64">
                      <img
                        alt="video preview"
                        src={linkPreview.thumbnail_url}
                      />
                    </p>
                  </figure>
                  <div className="media-content">
                    <div className="content">{linkPreview.title}</div>
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }
}
