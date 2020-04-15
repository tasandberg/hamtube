import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import RoomLayout from "../components/RoomLayout"
import apiClient from "../util/apiClient"
import initializeRoomSocket from "../util/initializeRoomSocket"
import getWebcam from "../util/getWebcam"

export default () => {
  const { roomId } = useParams()
  const [peers, setPeers] = useState({})
  const [sharing, _setSharing] = useState(true)
  const peerVids = {}
  let stream

  const initialize = () => {
    apiClient
      .get(`chat/${roomId}`)
      .then((res) => {
        initializeRoomSocket({
          peers,
          setPeers,
          stream,
          roomId: res.data.chat.id,
          sharing,
          peerVids,
        })
        startLocalVideo()
      })
      .catch((e) => console.log(e))
  }

  useEffect(() => {
    initialize()

    return () => {
      console.log("cleanup")
    }
  }, [initialize])

  const startLocalVideo = () => {
    getWebcam()
      .then((localStream) => {
        console.log("Local Video Obtained")

        stream = localStream
      })
      .catch((e) => console.log(e))
  }

  return <RoomLayout />
}
