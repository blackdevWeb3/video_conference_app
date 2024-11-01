import { useEffect, useRef } from "react";
import './video.css';

const VideoCard = ({peerId, call, stream, name, state}) => {
  const videoRef = useRef();

  useEffect(() => {
    videoRef.current.srcObject = stream;
  }, [stream])

  return (
    <div className="video-card">
      <div className="empty-avatar" style={{display: stream?"none":"flex"}}>
        <p>{name ? name.toUpperCase()[0]: "U"}</p>
      </div>
      <video ref={videoRef} autoPlay style={{visibility: stream?"visible":"hidden"}}></video>
      <span className="user-name">{name}</span>
    </div>
  )
}

export default VideoCard;