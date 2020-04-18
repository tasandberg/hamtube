import React from "react";
import { List } from "immutable";
import { extractVideoData, validUrl } from "../util/youtube-data";
import VideoPlayer from "../components/VideoPlayer";
import SongList from "../components/SongList";

const Logo = () => (
  <div className="logo">
    <h1 className="title is-4">
      Hamtube <i className="fas fa-bacon has-text-danger" />
    </h1>
  </div>
);
// https://www.youtube.com/watch?v=KUl7nLhM7UY
export default class KtvDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songQueue: new List(),
      queueInputValue: "",
      linkPreview: null,
      nowPlaying: null,
      songListOpen: false,
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

        this.enqueueSong();
      });
    }
  };

  songEnded = () => {
    this.setState((prevState) => ({
      ...prevState,
      nowPlaying: null,
    }));
    this.enqueueSong();
  };

  enqueueSong = (videoObject) => {
    if (!this.state.nowPlaying) {
      this.setState((prevState) => {
        const nextTrack = prevState.songQueue.first();
        return {
          ...prevState,
          songQueue: prevState.songQueue.shift(),
          nowPlaying: nextTrack,
        };
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

  openMenu = () => {
    this.setState({
      songListOpen: true,
    });
  };

  closeMenu = () => {
    this.setState({
      songListOpen: false,
    });
  };

  render() {
    const { songQueue, linkPreview, nowPlaying } = this.state;

    return (
      <div className="youtube-container">
        <Logo />
        <SongList
          closeModal={this.closeMenu}
          isActive={this.state.songListOpen}
        />
        <button className="button songlist-button" onClick={this.openMenu}>
          <span>Song List</span>
          <span className="icon is-small">
            <i className="fas fa-list"></i>
          </span>
        </button>
      </div>
    );
  }
}
