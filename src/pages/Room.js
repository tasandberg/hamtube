import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import apiClient from "../util/api"

const STATUS = {
  LOADING: "loading",
  LOADED: "200",
  NOT_FOUND: "404",
}

export default () => {
  const { roomId } = useParams()

  const [loadingStatus, setLoadingStatus] = useState(STATUS.LOADING)

  useEffect(() => {
    apiClient
      .get("/chat/" + roomId)
      .then((res) => {
        setLoadingStatus(STATUS.LOADED)
      })
      .catch((e) => {
        console.log(e)
        setLoadingStatus(STATUS.NOT_FOUND)
      })

    return () => {
      console.log("cleanup")
    }
  }, [roomId])

  const renderStatus = (status) => {
    switch (status) {
      case STATUS.LOADING:
        return ""
      case STATUS.LOADED:
        return `Room ${roomId} loaded`
      case STATUS.NOT_FOUND:
        return `404: Room ${roomId} Not Found`
      default:
        return "Loading"
    }
  }

  return (
    <section className="section">
      <h1>{renderStatus(loadingStatus)}</h1>
    </section>
  )
}
