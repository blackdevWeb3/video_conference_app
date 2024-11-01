import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Video from "../components/video/Video";
import Chat from "../components/chat/Chat";
import "../App.css";
import Peer from "peerjs";
import HoldingCard from "../components/holding/HoldingCard";
import { getRandomString } from "../utils";

const Room = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { state } = useLocation();
  const { host, name } = state || {};
  const [peer, setPeer] = useState();
  const socket = useRef();
  const [user, setUser] = useState({host, name: name || getRandomString()});
  const [holdingUsers, setHoldingUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [joint, setJoint] = useState(false);
  const [chat, showChat] = useState(false);

  const allowToJoin = (holder) => {
    socket.current.emit('allow-join', holder);
    setHoldingUsers(holdingUsers.filter(h => h.socketId !== holder.socketId))
  }
  const rejectToJoin = (holder) => {
    socket.current.emit('reject-join', holder);
    setHoldingUsers(holdingUsers.filter(h => h.socketId !== holder.socketId))
  }
  const allowAll = () => {
    socket.current.emit('allow-all', {roomId, socketIdList: holdingUsers.map(h => h.socketId)});
    setHoldingUsers([]);
  }

  useEffect(() => {
    socket.current = io("http://localhost:5000");
    if (host) {
      const peer = new Peer(roomId);
      setPeer(peer);
    } else {
      const peer = new Peer();
      peer.on('open', id => {
        setPeer(peer);
      });
    }
  }, []);

  useEffect(() => {
    console.log("holding users", holdingUsers);
  },[holdingUsers])

  useEffect(() => {
    if (peer) {
      socket.current.on("all-users", (users) => {
        setJoint(true);
        setMembers(users);
      })
      if (host) {
        socket.current.on('user-request-join', ({roomId, socketId, user}) => {
          setHoldingUsers(prev => [...prev, {roomId, socketId, user}]);
        })
        socket.current.emit('join-room', {
          roomId,
          peerId: peer.id,
          user
        })
      } else {
        socket.current.on('user-allow-join', ({roomId, token}) => {
          socket.current.emit('join-room', {roomId, peerId: peer.id, user, token})
        });
        socket.current.on('user-reject-join', (roomId) => {
          navigate('/');
          window.location.reload();
        })
        socket.current.on('host-not-found', (roomId) => {
          navigate('/');
          window.location.reload();
        });

        socket.current.emit('request-join', {roomId, user});
      }
    }
  }, [peer])

  return (
    <div className="room">
      <HoldingCard holdingUsers={holdingUsers} allow={allowToJoin} reject={rejectToJoin} allowAll={allowAll}/>
      {host || joint ? (
        <>
          <div className="videos">
            <Video
              roomId={roomId}
              socket={socket}
              user={user}
              peer={peer}
              members={members}
              setMembers={setMembers}
              showChat={showChat}
            />
          </div>
          <div className="chat" style={{display: chat?"flex":"none"}}>
            <Chat user={user} roomId={roomId} peerId={peer?.id} socket={socket} />
          </div>
        </>
      ) : (
        <h2>Waiting to allow you to join the room...</h2>
      )}
    </div>
  )
}
export default Room;