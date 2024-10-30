import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import socketFunctions from "../utils";
import Video from "../components/video/Video";
import Chat from "../components/chat/Chat";
import Peer from "peerjs";
import "../App.css";

const Room = () => {
  const { roomId } = useParams();
  const localVideo = useRef();
  const [peers, setPeers] = useState([]);
  const peer = new Peer();
  const addedPeers = useRef([]);
  const [localStream, setLocalStream] = useState(null);
  const socket = useRef();
  const [msgs, setMsgs] = useState([]);
  const [user, setUser] = useState();

  useEffect(() => {
    const user = prompt("Enter your name");
    setUser(user);
    socket.current = io("http://localhost:5000");
    socketFunctions.newMessage(socket, setMsgs);

    peer.on('open', userId => {
      socket.current.emit('join-room', { roomID: roomId, userID: userId, user });
    });
    
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
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

  useEffect(() => {
    console.log("peers", peers);
  }, [peers])

  return (
    <div className="room">
      <div className="videos">
        <Video
          user={user}
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