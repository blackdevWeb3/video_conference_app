import { useState } from "react";
import { useNavigate } from "react-router-dom"
import VideoCard from "./VideoCard";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import "./video.css";
import { MdLogout } from "react-icons/md";


const Video = ({localVideo, localStream, peers}) => {
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(!localStream);

  const toggleMic = () => {
    try {
      const audio = localVideo.current.srcObject.getAudioTracks()[0];
      if (micOn) {
        audio.enabled = false;
        setMicOn(false);
      } else {
        audio.enabled = true;
        setMicOn(true);
      }
    } catch (error) {
      console.log('Error in toggleMic', error);
    }
  };

  const toggleVideo = () => {
    try {
      const videoTrack = localStream.getTracks().find((track) => track.kind === 'video');
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOn(videoTrack.enabled);
      }
    } catch (error) {
      console.log('Error in toggleVideo', error);
    }
  }

  const endCall = () => {
    navigate('/');
    window.location.reload();
  }

  return (
    <div className="meet">
      <div className="meet-video">
        <video ref={localVideo} autoPlay></video>
        <div className="meet-options">
          <div className="video-buttons">
            <button onClick={toggleMic} style={micOn?{background: "#e2e2e2"}:null}>{micOn? <AiOutlineAudio/>:<AiOutlineAudioMuted color="white"/>}</button>
            <button onClick={toggleVideo} style={videoOn?{background: "#e2e2e2"}:null}>{videoOn? <BsCameraVideo/>:<BsCameraVideoOff color="white"/>}</button>
          </div>
          <div className="end-button">
            <button onClick={endCall}><MdLogout color="white"/></button>
          </div>
        </div>
      </div>
      <div className="meet-grid">
        {peers.map((peer) => {
          return (
            <VideoCard
              key={peer?.peerId}
              peer={peer?.peer}
              name={peer?.name}
              state={peer?.state}
            />
          )
        })}
      </div>
    </div>
  );
}

export default Video;