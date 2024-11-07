import { useEffect, useRef } from "react";
import './video.css';

const VideoCard = ({name, state, videoRef, onClickCard}) => {
  const ref = useRef();

  useEffect(() => {
    videoRef.ref = ref;
  }, [])

  return (
    <div className="video-card" onClick={onClickCard}>
      <div className="empty-avatar" style={{display: state > 2?"none":"flex"}}>
        <p>{name ? name.toUpperCase()[0]: "U"}</p>
      </div>
      <video ref={ref} autoPlay style={{visibility: state > 2?"visible":"hidden"}}></video>
      <span className="user-name">{name}</span>
    </div>
  )
}

export default VideoCard;