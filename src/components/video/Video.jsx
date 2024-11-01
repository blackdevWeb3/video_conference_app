import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"
import VideoCard from "./VideoCard";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import { MdCheck, MdLogout, MdOutlineScreenShare, MdShare } from "react-icons/md";
import { TbMessage } from "react-icons/tb";
import Peer from "peerjs";
import "./video.css";

const Video = ({roomId, user, peer, socket, members, showChat}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  // const localVideo = useRef();
  const mainVideo = useRef();
  const mainAudio = useRef();
  const [screenPeer, setScreenPeer] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  // const [audioStream, setAudioStream] = useState(null);
  const [mainStream, setMainStream] = useState(null);
  // const [screenStream, setScreenStream] = useState(null);
  // const [peers, setPeers] = useState([]);
  // const [newUsers, setNewUsers] = useState([]);

  const requestMedia = (video = true, audio = true) => {
    navigator.mediaDevices
    .getUserMedia({ video, audio })
    .then(stream => {
      // setVideoStream(stream);
      // members.forEach((m) => {
      //   peer.call(m.peerId, stream);
      // })
    })
    .catch(reason => console.log("request media failed", reason));
  }

  const requestScreenShare = () => {
    navigator.mediaDevices
    .getDisplayMedia({ video: true, audio: true})
    .then(stream => {
      setMainStream(stream);
      const callList = [];
      members.forEach((m) => {
        if (peer.id !== m.peerId) {
          const call = peer.call(m.peerId + "_screen", stream);
          callList.push(call);
        }
      })
      stream.getVideoTracks()[0].addEventListener('ended', (track, e) => {
        setMainStream(null);
        callList.forEach((call) => call.close());
      })
    })
    .catch(reason => console.log("request screen share failed", reason))
  }

  useEffect(() => {    
    if (peer) {
      // peer.on('call', call => {
      //   const member = members.find(m => m.peerId === call.peer);
      //   call.on('stream', remoteStream => {
      //     member.stream = remoteStream;
      //   });
      // });
      const screenPeer = new Peer(peer.id + "_screen", { host: import.meta.env.VITE_PEERJS_SERVER || "0.peerjs.com"});
      screenPeer.on('call', call => {
        call.answer(null);
        call.on('stream', screenStream => {
          setMainStream(screenStream);
          screenStream.getVideoTracks()[0].addEventListener('ended', (track, e) => {
            setMainStream(null);
          })
        })
      })
    }
  }, [peer]);

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
        <div className="empty-avatar" style={{display: mainStream?"none":"flex"}}>
          <p>{user.name ? user.name.toUpperCase()[0]: "U"}</p>
        </div>
        <video ref={mainVideo} autoPlay style={{visibility: mainStream?"visible":"hidden"}}></video>
        <audio hidden ref={mainAudio} autoPlay></audio>
        <div className="meet-options">
          <div className="video-buttons">
            <button onClick={toggleMic} style={micOn?{background: "#e2e2e2"}:null}>{micOn? <AiOutlineAudio/>:<AiOutlineAudioMuted color="white"/>}</button>
            <button onClick={toggleVideo} style={videoOn?{background: "#e2e2e2"}:null}>{videoOn? <BsCameraVideo/>:<BsCameraVideoOff color="white"/>}</button>
            <button onClick={requestScreenShare} style={{background: "#e2e2e2"}}><MdOutlineScreenShare color="grey"/></button>
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
              stream={m.stream}
              name={m.name}
            />
          )
        })}
      </div>
    </div>
  );
}

export default Video;