import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"
import VideoCard from "./VideoCard";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import "./video.css";
import { MdCheck, MdLogout, MdShare } from "react-icons/md";
import { TbMessage } from "react-icons/tb";


const Video = ({roomId, user, peer, socket, members, setMembers, showChat}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const localVideo = useRef();
  const [localStream, setLocalStream] = useState(null);
  const mainVideo = useRef();
  const [mainStream, setMainStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [newUsers, setNewUsers] = useState([]);

  const requestMedia = (video, audio) => {
    navigator.mediaDevices
    .getUserMedia({ video, audio })
    .then(stream => {
      setMainStream(stream);
    })
    .catch(reason => console.log(reason));
  }

  useEffect(() => {    
    if (peer) {
      peer?.on('call', call => {
        if (!peers.find(p => p.peerId, call.peer)) {
          call.answer(localStream);
          call.on('stream', remoteStream => {
            setPeers([...peers, {
              call,
              peerId: call.peer,
              stream: remoteStream,
              name: newUsers.find(u => u.peerId === call.peer)
            }])
            setNewUsers(newUsers.filter(u => u.peerId !== call.peer));
          });
        }
      });
    }
  }, [peer]);

  // useEffect(() => {
  //   localVideo.current.srcObject = localStream;
  // }, [localStream]);
  useEffect(() => {
    mainVideo.current.srcObject = mainStream;
  }, [mainStream])

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
        <div className="empty-avatar" style={{display: videoOn?"none":"flex"}}>
          <p>{user.name ? user.name.toUpperCase()[0]: "U"}</p>
        </div>
        <video ref={mainVideo} autoPlay style={{visibility: videoOn?"visible":"hidden"}}></video>
        <div className="meet-options">
          <div className="video-buttons">
            <button onClick={toggleMic} style={micOn?{background: "#e2e2e2"}:null}>{micOn? <AiOutlineAudio/>:<AiOutlineAudioMuted color="white"/>}</button>
            <button onClick={toggleVideo} style={videoOn?{background: "#e2e2e2"}:null}>{videoOn? <BsCameraVideo/>:<BsCameraVideoOff color="white"/>}</button>
          </div>
          <div className="end-button">
            <button onClick={() => showChat(prev => !prev)} style={{background: "#e2e2e2"}}><TbMessage color="grey"/></button>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.origin + "/conference/" + roomId);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 2000);
            }} style={{background: "#e2e2e2"}}>{copied ? <MdCheck color="green" /> : <MdShare color="grey"/>}</button>
            <button onClick={endCall}><MdLogout color="white"/></button>
          </div>
        </div>
      </div>
      <div className="meet-grid">
        {members.map((m, index) => {
          return (
            <VideoCard
              key={index}
              peerId={m.peerId}
              // call={p?.call}
              // stream={p?.stream}
              name={m.name}
            />
          )
        })}
      </div>
    </div>
  );
}

export default Video;