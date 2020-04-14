const vidOptions = {
  video: {
    facingMode: "user",
    width: { min: 160, ideal: 640, max: 1280 },
    height: { min: 120, ideal: 360, max: 720 },
  },
  audio: true,
}

export default function () {
  console.log("Requesting local webcam stream")
  return navigator.mediaDevices.getUserMedia(vidOptions)
}
