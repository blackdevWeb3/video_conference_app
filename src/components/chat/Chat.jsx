import { useEffect, useRef, useState } from "react";
import "./chat.css";

const Chat = ({user, roomId, peerId, socket}) => {
  const chatMessageRef = useRef(null);
  const [msgText, setMsgText] = useState("");
  const [msgs, setMsgs] = useState([]);
  
  const sendMessage = () => {
    try {
      if (msgText) {
        const msg = {
          roomId,
          from: peerId,
          user,
          message: msgText.trim()
        };
        // setMsgs([...msgs, msg])
        socket.current?.emit('send-message', msg);
        setMsgText("");
      }
    } catch (error) {
      console.log('Error in sendMessage', error);
    }
  }

  useEffect(() => {
    if (socket.current) {
      socket.current.on("message", (data) => {
        setMsgs((msgs) => [...msgs, data]);
      });
    }
  }, [socket.current])

  useEffect(() => {
    if (chatMessageRef.current) {
      chatMessageRef.current.scrollTop = chatMessageRef.current.scrollHeight;
    }
  }, [msgs]);

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={chatMessageRef}>
        {msgs.map((msg, index) => {
          return peerId === msg.from ? (
            <div key={index} className="chat-message user-message">
              <p className="user-text">{msg.message}</p>
            </div>
          ) : (
            <div key={index} className="chat-message">
              <p className="chat-user">{msg.user.name}</p>
              <p className="chat-text">{msg.message}</p>
            </div>
          );
        })}
      </div>
      <div className="chat-input">
        <input
          type="text" 
          placeholder="Type a message" 
          value={msgText} 
          onChange={(e) => setMsgText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
        />
      </div>
    </div>
  )
}

export default Chat;