import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import { MoonLoader } from "react-spinners";
import { useMicVAD } from "@ricky0123/vad-react";

const uuid = v4();

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({host: true, name: localStorage.getItem("name")});
  const [micOn, setMicOn] = useState();
  const [videoOn, setVideoOn] = useState();

  useEffect(() => {
    checkPermission("camera", setVideoOn);
    checkPermission("microphone", setMicOn);
  }, [])

  return (
    <PrepareMeeting 
      user={user} 
      setUser={setUser}
      micOn={micOn}
      setMicOn={setMicOn}
      videoOn={videoOn}
      setVideoOn={setVideoOn}
      onAction={() => {
        navigate(`/${uuid}`, {
          state: {
            defaultUser: user,
            mic: micOn, 
            video: videoOn, 
            host: true
          }
        });
      }}
      actionText={"Create conference"}
    />
  )
}
export default Home;

export const PrepareMeeting = ({user, setUser, onAction, actionText, micOn, setMicOn, videoOn, setVideoOn}) => {
  const ref = useRef();
  const [spinner, setSpinner] = useState(false);
  const [init, setInit] = useState(false);

  const toggleMic = () => {
    if (micOn) {
      removeStream(ref, "audio")
      setMicOn(false);
    } else {
      navigator.mediaDevices
      .getUserMedia({video: false, audio:{
        echoCancellation: false,
        noiseSuppression: false,
      }})
      .then(device => {
        addStream(ref, device, "audio")
        setMicOn(true);
      })
    }
  }
  const toggleVideo = () => {
    if (videoOn) {
      removeStream(ref, "video")
      setVideoOn(false);
    } else {
      navigator.mediaDevices
      .getUserMedia({video: true, audio:false})
      .then(device => {
        addStream(ref, device, "video")
        setVideoOn(true);
      })
    }
  }

  useEffect(() => {
    if (micOn !== undefined || videoOn !== undefined) {
      if (!init) {
        navigator.mediaDevices
        .getUserMedia({video: videoOn !== undefined, audio: micOn !== undefined ? {
          echoCancellation: false,
          noiseSuppression: false,
        } : false})
        .then(device => {
          addStream(ref, device)
          setVideoOn(videoOn !== undefined ? true : undefined);
          setMicOn(micOn !== undefined ? true : undefined);
        });
      }
      setInit(true);
    }
  }, [micOn, videoOn])

  return (
    <div className="home-container">
      <div className="video-container">
        <video ref={ref} autoPlay muted style={{visibility: videoOn ? "visible" : "hidden"}}/>
        <div className="button-group">
          <button onClick={toggleMic} className={micOn?"on":null}>
            {micOn ? <AiOutlineAudio color="white"/>:<AiOutlineAudioMuted color="white"/>}
            {(micOn === undefined) && (<i>!</i>)}
          </button>
          <button onClick={toggleVideo} className={videoOn?"on":null}>
            {videoOn ? <BsCameraVideo color="white"/>:<BsCameraVideoOff color="white"/>}
            {videoOn === undefined && <i>!</i>}
          </button>
        </div>
        {micOn && (
          <div className="voice-detector">
            <VoiceDetector color="white" count={3}/>
          </div>
        )}
      </div>
      <div className="action-group">
        <h3>What's your name?</h3>
        <input placeholder="Your name" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
        <button disabled={!user.name || spinner} onClick={() => {
          setSpinner(true);
          localStorage.setItem("name", user.name)
          onAction();
          removeStream(ref);
          // setTimeout(() => setSpinner(false), 120000)
        }}>{actionText}</button>
        { spinner && <div className="spinner"><MoonLoader color="#004dfd" size={32}/></div>}
      </div>
    </div>
  )
}

export const VoiceDetector = ({gap, color, count, startOnLoad = true, load, onSpeechStart, onSpeechEnd}) => {
  const [loading, setLoading] = useState(false);
  useMicVAD({
    model: "v5",
    userSpeakingThreshold: 1,
    startOnLoad,
    baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.21/dist/",
    onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/",
    minSpeechFrames: 1,
    onSpeechStart: () => {
      setLoading(true);
      onSpeechStart && onSpeechStart();
    },
    onSpeechEnd: () => {
      setLoading(false);
      onSpeechEnd && onSpeechEnd();
    },
  });
  return (
    <div
      className={`voice-detector-container ${loading || load ? "loading":""}`}
      style={{gap: gap ?? ""}}
    >
      {new Array(count ?? 3).fill(1).map((_, index) => <i key={index} style={{color: color ?? "", animationDelay: `${index * 0.2}s`}}></i>)}
    </div>
  )
}

export const checkPermission = (name, setState) => {
  navigator.permissions
    .query({name})
    .then(status => {
      switch (status.state) {
        case `denied`:
        case `prompt`:
          setState(undefined);
          break;
        case `granted`:
        default:
          setState(false);
          break;
      }
    })
}

export const addStream = (ref, stream, videoOrAudio) => {
  if (ref.current.srcObject) {
    if (videoOrAudio === "video") {
      ref.current.srcObject.getVideoTracks().forEach(track => {
        track.stop();
        ref.current.srcObject.removeTrack(track);
      });
      ref.current.srcObject.addTrack(stream.getVideoTracks()[0]);
    } else if (videoOrAudio === "audio") {
      ref.current.srcObject.getAudioTracks().forEach(track => {
        track.stop();
        ref.current.srcObject.removeTrack(track);
      });
      ref.current.srcObject.addTrack(stream.getAudioTracks()[0]);
    } else {
      ref.current.srcObject.getTracks().forEach(track => {
        track.stop();
        ref.current.srcObject.removeTrack(track);
      });
      ref.current.srcObject = stream;
    }
  } else {
    ref.current.srcObject = stream;
  }
}

export const removeStream = (ref, videoOrAudio) => {
  if (ref.current?.srcObject) {
    if (videoOrAudio === "video") {
      ref.current.srcObject.getVideoTracks().forEach(track => {
        track.stop();
        ref.current.srcObject.removeTrack(track);
      });
    } else if (videoOrAudio === "audio") {
      ref.current.srcObject.getAudioTracks().forEach(track => {
        track.stop();
        ref.current.srcObject.removeTrack(track);
      });
    } else {
      ref.current.srcObject.getTracks().forEach(track => {
        track.stop();
        ref.current.srcObject.removeTrack(track);
      });
    }
  }
}