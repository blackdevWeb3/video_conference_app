import { useEffect, useRef } from "react";
import './video.css';
import { AiOutlineAudioMuted } from "react-icons/ai";

const VideoCard = ({name, avatar, state, videoRef, muted, onClickCard}) => {
  const ref = useRef();

  useEffect(() => {
    videoRef.ref = ref;
  }, [])

  return (
    <div className="video-card" onClick={onClickCard}>
      <div className="empty-avatar" style={{display: state && state.video ?"none":"flex"}}>
        {avatar ? <img src={avatar} alt={avatar}/> : <p>{name.toUpperCase()[0]}</p>}
      </div>
      <video ref={ref} autoPlay muted={muted} style={{visibility: state && state.video ?"visible":"hidden"}}></video>
      <span className="user-name">{name}</span>
      {(!state || !state.audio) && <div className="muted"><AiOutlineAudioMuted color="rgb(234, 67, 53)" /></div>}
    </div>
  )
}

export default VideoCard;