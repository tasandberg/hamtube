import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../util/api";

const STATUS = {
  LOADING: "loading",
  LOADED: "200",
  NOT_FOUND: "404",
};

const colors = [
  "has-background-primary",
  "has-background-info",
  "has-background-warning",
  "has-background-danger",
  "has-background-success",
  "has-background-primary",
  "has-background-info",
  "has-background-warning",
  "has-background-danger",
  "has-background-success",
];

export default () => {
  const { roomId } = useParams();

  const [loadingStatus, setLoadingStatus] = useState(STATUS.LOADING);
  const [videos, setVideos] = useState(colors);

  const addVideo = () => {
    const newIndex = videos.length % colors.length;
  };

  useEffect(() => {
    apiClient
      .get("/chat/" + roomId)
      .then((res) => {
        setLoadingStatus(STATUS.LOADED);
      })
      .catch((e) => {
        console.log(e);
        setLoadingStatus(STATUS.NOT_FOUND);
      });

    return () => {
      console.log("cleanup");
    };
  }, [roomId]);

  const renderStatus = (status) => {
    switch (status) {
      case STATUS.LOADING:
        return "";
      case STATUS.LOADED:
        return `Room ${roomId} loaded`;
      case STATUS.NOT_FOUND:
        return `404: Room ${roomId} Not Found`;
      default:
        return "Loading";
    }
  };

  return (
    <div className="columns is-multiline">
      <button
        style={{
          position: "absolute",
          left: "calc(50% - 53.5px)",
          top: "100px",
        }}
        onClick={addVideo}
        className="button is-primary">
        Add video
      </button>
      {videos.map((v, i) => (
        <div
          style={{ height: "300px" }}
          className={`column is-one-quarter ${v}`}
          key={`video-${i}`}>
          Video {i + 1}
        </div>
      ))}
    </div>
  );
};
