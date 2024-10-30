import { useRef } from "react";
import './video.css';

const VideoCard = ({peer}) => {
  const videoRef = useRef();

  peer.on('stream', (stream) => {
    videoRef.current.srcObject = stream;
  })

  return (
    <div className="video-card">
      <video ref={videoRef} autoPlay></video>
    </div>
  )
}

export default VideoCard;