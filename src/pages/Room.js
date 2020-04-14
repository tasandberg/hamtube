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
    <div className="columns">
      <div
        className="column is-4 has-background-dark has-text-light"
        style={{ height: "50vh" }}>
        Main video
      </div>
      <div className="column">
        <div className="columns is-multiline">
          {videos.map((v, i) => (
            <div
              style={{ alignItems: "stretch", height: "25vh" }}
              className={`column  is-one-third ${v}`}
              key={`video-${i}`}>
              Video {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
