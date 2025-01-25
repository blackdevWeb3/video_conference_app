import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import { MdCheck, MdLogout, MdOutlineScreenShare, MdShare } from "react-icons/md";
import { TbMessage } from "react-icons/tb";
import Peer from "peerjs";
import "./video.css";
import VideoCard from "./VideoCard";
import DummyVideo from "../../assets/media.mp4";
import { addStream, removeStream, VoiceDetector } from "../../pages/Home";

const Video = ({roomId, user, peer, socket, members, setMembers, showChat, newMsg, mic, video}) => {
  const navigate = useNavigate();
  
  const [copied, setCopied] = useState(false);
  const [init, setInit] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const micOnRef = useRef(micOn);
  const videoOnRef = useRef(videoOn);
  const screenPeer = useRef();
  
  const screenStream =useRef();
  const sharedScreen = useRef(false);
  const mainDisplay = useRef();
  const [mainUsername, setMainUsername] = useState(null);
  const [mainAvatar, setMainAvatar] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const mainPeerId = useRef("");
  const [mainState, setMainState] = useState();
  const videoRefs = useRef({});
  const dummyStream = useRef();

  useEffect(() => {
    let video = document.createElement("video");
    video.src = DummyVideo;
    video.oncanplay = (e) => {
      dummyStream.current = video.captureStream();
      dummyStream.current.getTracks().map(track => track.stop())
    }
  }, []);

  const getEmptyTrack = (videoOrAudio) => {
    if (videoOrAudio === "video") {
      return dummyStream.current?.getVideoTracks()[0]
    } else if (videoOrAudio === "audio") {
      return dummyStream.current?.getAudioTracks()[0]
    } else return dummyStream.current?.getTracks();
  }

  const requestScreenShare = () => {
    navigator.mediaDevices
    .getDisplayMedia({ video: true, audio: true})
    .then(stream => {
      screenStream.current = stream;
      sharedScreen.current = true;
      
      mainDisplay.current.srcObject = stream;
      setMainAvatar(null);
      setMainUsername("Screen sharing...");
      setMainState({ video: true, audio: true});
      
      members.forEach((m) => {
        if (peer.current.id !== m.peerId) {
          videoRefs.current[m.peerId].screenCall = screenPeer.current.call(m.peerId + "_screen", stream);
        }
      })
      stream.getVideoTracks()[0].addEventListener('ended', (track, e) => {
        stream.getTracks().map(track => track.stop())
        screenStream.current = null;
        sharedScreen.current = false;

        const member = members.find(m => m.peerId === mainPeerId.current);
        mainDisplay.current.srcObject = videoRefs.current[mainPeerId.current].ref.current.srcObject;
        setMainAvatar(member.avatar);
        setMainUsername(member.name);
        setMainState(member.state);
        
        Object.keys(videoRefs.current).forEach((key) => {
          videoRefs.current[key].screenCall?.close();
          delete videoRefs.current[key].screenCall;
        });
      })
    })
    .catch(reason => console.log("request screen share failed", reason))
  }
  const getScreenShare = (screen) => {
    screenStream.current?.getTracks().forEach(track => track.stop());
    screenStream.current = null
    sharedScreen.current = true;
    
    mainDisplay.current.srcObject = screen;
    setMainAvatar(null);
    setMainUsername("Screen sharing...");
    setMainState({ video: true, audio: true});
    screen.getVideoTracks()[0].addEventListener('ended', (track, e) => {
      sharedScreen.current = false;
      screen.getTracks().map(track => track.stop());

      const member = members.find(m => m.peerId === mainPeerId.current);
      mainDisplay.current.srcObject = videoRefs.current[mainPeerId.current].ref.current.srcObject;
      setMainAvatar(member.avatar);
      setMainUsername(member.name);
      setMainState(member.state);
    })
  }
  const setSrcObject = (ref, stream, callback) => {
    if (ref.current) {
      if (!ref.current.srcObject) {
        addStream(ref, stream);
        callback && callback();
        ref.current.play();
      }
    } else {
      setTimeout(() => setSrcObject(ref, stream, callback), 1000);
    }
  }
  const setState = (peerId, state) => {
    setMembers(prev => prev.map((m) => {
      if (m.peerId === peerId) {
        m.state = {...m.state, ...state};
        if (mainPeerId.current === peerId && !sharedScreen.current) {
          setMainState(m.state);
        }
      }
      return m;
    }))
  }
  const startTracks = (tracks, videoOrAudio) => {
    Object.keys(videoRefs.current).forEach(peerId => {
      if (peerId !== peer.current.id) {
        if (videoRefs.current[peerId].call) {
          videoOrAudio.forEach(media => {
            const sender = videoRefs.current[peerId].call.peerConnection.getSenders().find(s => s.track?.kind === media);
            if (sender) {
              sender.replaceTrack(tracks[media]);
            }
          })
        } else {
          videoRefs.current[peerId].call = peer.current.call(
            peerId, 
            new MediaStream(["audio", "video"].map(key => {
              if (tracks[key]) {
                return tracks[key];
              } else {
                return getEmptyTrack(key);
              }
            })));
        }
      }
    })
  }
  const stopTracks = (videoOrAudio) => {
    Object.keys(videoRefs.current).forEach(peerId => {
      if (peerId !== peer.current.id) {
        videoOrAudio.forEach(media => {
          const sender = videoRefs.current[peerId].call?.peerConnection.getSenders().find(s => s.track?.kind === media);
          if (sender) {
            sender.track.stop();
          }
        })
      }
    })
  }

  const onVoiceDetected = (action) => {
    socket.current.emit('send-signal', {
      type: 'voice-detect',
      peerId: peer.current.id,
      name: user.name,
      avatar: user.avatar,
      action,
      state: { video: videoOnRef.current, audio: micOnRef.current}
    })
  }

  useEffect(() => {
    Object.keys(videoRefs.current).forEach(key => {
      if (!members.find(member => member.peerId === key)) {
        delete videoRefs.current[key];
      }
    })
  }, [members])

  useEffect(() => {
    if (peer.current) {
      screenPeer.current = new Peer(peer.current.id + "_screen", { host: import.meta.env.VITE_PEERJS_SERVER || "0.peerjs.com" });

      socket.current.on("user-joined", (user) => {
        setMembers(prev => [...prev, user]);
      })
      socket.current.on("multi-users-joined", (users) => {
        setMembers(prev => [...prev, ...users]);
      })
      socket.current.on("user-left", (user) => {
        setMembers(prev => prev.filter(u => u.peerId !== user.peerId));
      })
      socket.current.on('signals', (data) => {
        switch (data.type) {
          case "voice-detect":
            if (data.peerId === peer.current.id) return;
            if (data.peerId !== mainPeerId.current) {
              mainDisplay.current.srcObject = videoRefs.current[data.peerId].ref.current.srcObject;
              setMainAvatar(data.avatar);
              setMainUsername(data.name);
              mainPeerId.current = data.peerId;
              setMainState(data.state);
            }
            if (data.action === 'start') {
              setSpeaking(true);
            } else if (data.peerId === mainPeerId.current) {
              setSpeaking(false);
            }
            break;
          case "audio":
            setState(data.peerId, {audio: data.action === "on"});
            break;
          case "video":
            setState(data.peerId, {video: data.action === "on"})
            break;
          case 'state':
          default:
            setState(data.peerId, data.state);
        }
      });
      socket.current.on("user-ready", (user) => {
        if (videoOnRef.current || micOnRef.current)
          videoRefs.current[peer.current.id].call = peer.current.call(
            user.peerId,
            new MediaStream(videoRefs.current[peer.current.id].ref.current.srcObject.getTracks())
          )
        socket.current.emit('send-signal', {
          type: 'state',
          peerId: peer.current.id,
          state: {video: videoOnRef.current, audio: micOnRef.current}
        })
        if (screenStream.current)
          videoRefs.current[user.peerId].screenCall = screenPeer.current.call(user.peerId + "_screen", screenStream.current);
      })
      peer.current.on('call', call => {
        call.answer();
        call.on('stream', remoteStream => {
          setSrcObject(videoRefs.current[call.peer].ref, remoteStream);
        });
      });
      screenPeer.current.on('call', call => {
        call.answer();
        call.on('stream', screen => {
          getScreenShare(screen);
        })
      });
      
      setMainAvatar(user.avatar);
      setMainUsername(user.name);
      mainPeerId.current = peer.current.id;
      setMainState({video, audio: mic});
      socket.current.emit("am-ready", {roomId, peerId: peer.current.id, user});
    }
  }, [peer.current]);

  useEffect(() => {
    if (mic || video) {
      if (!init) {
        navigator.mediaDevices
        .getUserMedia({video: video === true, audio: mic ? {
          noiseSuppression: true,
          echoCancellation: false,
        } : false})
        .then(stream => {
          addStream(videoRefs.current[peer.current.id].ref, stream, "both");
          if (mainPeerId.current === peer.current.id) mainDisplay.current.srcObject = videoRefs.current[peer.current.id].ref.current.captureStream();
          startTracks({
            video: video ? stream.getVideoTracks()[0] : null,
            audio: mic ? stream.getAudioTracks()[0] : null
          }, (video ? ["video"] : []).concat(mic ? ["audio"] : []));
          setVideoOn(video);
          socket.current?.emit('send-signal', {type: "video", peerId: peer.current.id, action: video?"on":"off"})
          setMicOn(mic);
          socket.current?.emit('send-signal', {type: "audio", peerId: peer.current.id, action: mic?"on":"off"})
        });
      }
      setInit(true);
    }
  }, [mic, video])

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn])
  useEffect(() => {
    videoOnRef.current = videoOn;
  }, [videoOn])

  const toggleMic = (onOrOff) => {
    try {
      if (onOrOff === "off" || (onOrOff !== "on" && micOn)) {
        removeStream(videoRefs.current[peer.current.id].ref, "audio")
        if (mainPeerId.current === peer.current.id) mainDisplay.current.srcObject = videoRefs.current[peer.current.id].ref.current.captureStream();
        
        stopTracks(["audio"])
        setMicOn(false);
        socket.current?.emit('send-signal', {type: "audio", peerId: peer.current.id, action: "off"})
      } else {
        navigator.mediaDevices
        .getUserMedia({video: false, audio:{
          noiseSuppression: true,
          echoCancellation: false,
        }})
        .then(stream => {
          addStream(videoRefs.current[peer.current.id].ref, stream, "audio")
          if (mainPeerId.current === peer.current.id) mainDisplay.current.srcObject = videoRefs.current[peer.current.id].ref.current.captureStream();
          
          startTracks({
            audio: stream.getAudioTracks()[0]
          }, ["audio"]);
          setMicOn(true);
          socket.current?.emit('send-signal', {type: "audio", peerId: peer.current.id, action: "on"})
        })
      }
    } catch (error) {
      console.log('Error in toggleMic', error);
    }
  };

  const toggleVideo = (onOrOff) => {
    try {
      if (onOrOff === "off" || (onOrOff !== "on" && videoOn)) {
        removeStream(videoRefs.current[peer.current.id].ref, "video")
        if (mainPeerId.current === peer.current.id) mainDisplay.current.srcObject = videoRefs.current[peer.current.id].ref.current.captureStream();
        
        stopTracks(["video"])
        setVideoOn(false);
        socket.current?.emit('send-signal', {type: "video", peerId: peer.current.id, action: "off"})
      } else {
        navigator.mediaDevices
        .getUserMedia({video: true, audio:false})
        .then(stream => {
          addStream(videoRefs.current[peer.current.id].ref, stream, "video");
          if (mainPeerId.current === peer.current.id) mainDisplay.current.srcObject = videoRefs.current[peer.current.id].ref.current.captureStream();
          startTracks({
            video: stream.getVideoTracks()[0]
          }, ["video"])
          setVideoOn(true);
          socket.current?.emit('send-signal', {type: "video", peerId: peer.current.id, action: "on"})
        })
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
        <div className="empty-avatar" style={{display: mainState && mainState.video?"none":"flex"}}>
          {mainAvatar ? <img src={mainAvatar} alt={mainAvatar}/> : <p>{mainUsername?.toUpperCase()[0]}</p>}
        </div>
        <video ref={mainDisplay} autoPlay muted={mainPeerId.current === peer.current.id} style={{visibility: mainState && mainState.video?"visible":"hidden"}}></video>
        <span className="user-name">{mainUsername ?? ""}</span>
        {(!mainState || !mainState.audio) ? <div className="muted"><AiOutlineAudioMuted color="rgb(234, 67, 53)" /></div> : speaking ? <VoiceDetector startOnLoad={false} load={speaking} /> : null}
        <div className="meet-options">
          <div className="video-buttons">
            {micOn && <VoiceDetector onSpeechStart={() => onVoiceDetected("start")} onSpeechEnd={() => onVoiceDetected("end")}/>}
            <button onClick={toggleMic} className={micOn?"on":null}>
              {micOn ? <AiOutlineAudio color="white"/> : <AiOutlineAudioMuted color="white"/>}
              {micOn === undefined && <i>!</i>}
            </button>
            <button onClick={toggleVideo} className={videoOn?"on":null}>
              {videoOn ? <BsCameraVideo color="white"/> : <BsCameraVideoOff color="white"/>}
              {videoOn === undefined && <i>!</i>}
            </button>
            <button onClick={requestScreenShare} className="on"><MdOutlineScreenShare color="white"/></button>
          </div>
          <div className="end-button">
            <button onClick={() => showChat(prev => !prev)} className="on" style={{position: "relative"}}>
              <TbMessage color="white"/>
              {
                newMsg && <i></i>
              }
            </button>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.origin + "/" + roomId);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 2000);
            }} className="on">{copied ? <MdCheck color="lightgreen" /> : <MdShare color="white"/>}</button>
            <button onClick={endCall}><MdLogout color="white"/></button>
          </div>
        </div>
      </div>
      <div className="meet-grid">
        {members.map((m) => {
          if (videoRefs.current[m.peerId] === undefined) {
            videoRefs.current[m.peerId] = {
              ref: null,
              call: null
            }
          }
          
          return (
            <VideoCard
              key={m.peerId}
              avatar={m.avatar}
              name={m.name}
              state={m.state}
              videoRef={videoRefs.current[m.peerId]}
              muted={peer.current.id === m.peerId}
              onClickCard={() => {
                if (!sharedScreen.current) {
                  mainDisplay.current.srcObject = videoRefs.current[m.peerId].ref.current.srcObject;
                  setMainAvatar(m.avatar);
                  setMainUsername(m.name);
                  setMainState(m.state);
                  mainPeerId.current = m.peerId;
                }
              }}
            />
          )
        })}
      </div>
    </div>
  );
}

export default Video;