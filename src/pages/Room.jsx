import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "peerjs";
import { v4 } from "uuid";
import Chat from "../components/chat/Chat";
import Video from "../components/video/Video";
import HoldingCard from "../components/holding/HoldingCard";
import { checkPermission, PrepareMeeting } from "./Home";

const Room = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { state } = useLocation();
  const { defaultUser, mic, video, host } = state || {};
  const peer = useRef();
  const socket = useRef();
  const [holdingUsers, setHoldingUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [joint, setJoint] = useState(false);
  const [chat, showChat] = useState(false);
  const [newMsg, setNewMsg] = useState(false);
  const [user, setUser] = useState(host ? defaultUser : { name: "" });
  const userRef = useRef(user);
  const [micOn, setMicOn] = useState();
  const [videoOn, setVideoOn] = useState();

  const allowToJoin = (holder) => {
    socket.current.emit('allow-join', holder);
    setHoldingUsers(holdingUsers.filter(h => h.socketId !== holder.socketId))
  }
  const rejectToJoin = (holder) => {
    socket.current.emit('reject-join', holder);
    setHoldingUsers(holdingUsers.filter(h => h.socketId !== holder.socketId))
  }
  const allowAll = () => {
    socket.current.emit('allow-all', {roomId, newUsers: holdingUsers.map(h => ({
      socketId: h.socketId,
      peerId: h.peerId,
      name: h.user.name
    }))});
    setHoldingUsers([]);
  }
  const requestJoin = () => {
    socket.current.emit('request-join', {roomId, peerId: peer.current.id, user: userRef.current});
  }

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_SOCKETIO_SERVER, {
      transports: ['websocket']
    });
    peer.current = new Peer(host ? roomId : v4(), { host: import.meta.env.VITE_PEERJS_SERVER || "0.peerjs.com" });
    socket.current.on("all-users", (users) => {
      setMembers(users);
      setJoint(true);
    })
    if (host) {
      socket.current.on('user-request-join', ({roomId, socketId, peerId, user}) => {
        setHoldingUsers(prev => prev.find(h => h.peerId === peerId)? prev : [...prev, {roomId, socketId, peerId, user}]);
      })
      socket.current.emit('join-room', {
        roomId,
        peerId: peer.current.id,
        user: userRef.current
      })
    } else {
      socket.current.on('user-allow-join', ({roomId, token}) => {
        socket.current.emit('join-room', {roomId, peerId: peer.current.id, user: userRef.current, token})
      });
      socket.current.on('user-reject-join', (roomId) => {
        navigate('/');
        window.location.reload();
      })
      socket.current.on('host-not-found', (roomId) => {
        navigate('/');
        window.location.reload();
      });
    }
    checkPermission("camera", setVideoOn);
    checkPermission("microphone", setMicOn);
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user])

  return (
    <div className="room">
      <HoldingCard holdingUsers={holdingUsers} allow={allowToJoin} reject={rejectToJoin} allowAll={allowAll}/>
      {(host || joint) && members.length ? (
        <>
          <div className="videos">
            <Video
              roomId={roomId}
              socket={socket}
              user={host ? defaultUser : userRef.current}
              peer={peer}
              members={members}
              setMembers={setMembers}
              showChat={showChat}
              newMsg={!chat && newMsg}
              mic={host ? mic : micOn}
              video={host ? video : videoOn}
              style={{width: `calc(100% - ${chat?"20rem":"0"})`}}
            />
          </div>
          <div className="chat" style={{display: chat?"flex":"none"}}>
            <Chat user={host ? defaultUser : userRef.current} roomId={roomId} peerId={peer.current?.id} socket={socket} setNewMsg={setNewMsg} />
          </div>
        </>
      ) : host ? <h2>Creating conference...</h2> : (
        <PrepareMeeting
          user={user}
          setUser={setUser}
          micOn={micOn}
          setMicOn={setMicOn}
          videoOn={videoOn}
          setVideoOn={setVideoOn}
          onAction={requestJoin} 
          actionText={"Join conference"}
        />
      )}
    </div>
  )
}
export default Room;