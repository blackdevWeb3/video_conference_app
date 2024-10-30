import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import socketFunctions from "../utils";
import Video from "../components/video/Video";
import Chat from "../components/chat/Chat";
import Peer from "peerjs";
import "../App.css";

const Room = ({user = "Host User"}) => {
  const { roomId } = useParams();
  const localVideo = useRef();
  const [peers, setPeers] = useState([]);
  const peer = new Peer();
  const addedPeers = useRef([]);
  const [localStream, setLocalStream] = useState(null);
  const socket = useRef();
  const [msgs, setMsgs] = useState([]);

  useEffect(() => {
    socket.current = io("http://localhost:5000");
    socketFunctions.newMessage(socket, setMsgs);

    peer.on('open', userId => {
      socket.current.emit('join-room', { roomID: roomId, userID: userId, user });
    });
    
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        localVideo.current.srcObject = stream;
        peer.on('call', call => {
          const peerId = call.peer;
          socket.current.emit('find-user', { roomID: roomId, peerID: peerId });
          call.answer(stream);
          socketFunctions.connectToNewUser(socket, peerId, addedPeers, call, setPeers);
        });
        socketFunctions.getAllUsers(socket, addedPeers, stream, peer, setPeers);
        socketFunctions.disconnectUser(socket, setPeers);
      })
      .catch(reason => console.log(reason));
  }, []);

  return (
    <div className="room">
      <div className="videos">
        <Video
          peers={peers}
          localVideo={localVideo}
          localStream={localStream}
        />
      </div>
      <div className="chat">
        <Chat user={user} roomId={roomId} socket={socket} msgs={msgs} />
      </div>
    </div>
  )
}
export default Room;