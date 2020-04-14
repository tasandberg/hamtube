import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import RoomLayout from "../components/RoomLayout"
import apiClient from "../util/apiClient"

export default () => {
  const { roomId } = useParams()
  const [peers, setPeers] = useState({})
  const [sharing, setSharing] = useState(true)
  const peerVids = {}

  useEffect(() => {
    apiClient
      .get(`chat/${roomId}`)
      .then((res) => {
        console.log(res)
      })
      .catch((e) => console.log(e))
    return () => {
      console.log("cleanup")
    }
  }, [roomId])

  return <RoomLayout />
}
