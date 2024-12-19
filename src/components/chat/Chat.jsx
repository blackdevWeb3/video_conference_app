import { useEffect, useRef, useState } from "react";
import "./chat.css";

const Chat = ({user, roomId, peerId, socket, setNewMsg}) => {
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
        setNewMsg(true);
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
    <div className="chat-box" onMouseMove={() => setNewMsg(false)}>
      <div className="chat-messages" ref={chatMessageRef}>
        {msgs.map((msg, index) => {
          return peerId === msg.from ? (
            <div key={index} className="chat-message user-message">
              <p className="user-text">{msg.message}</p>
            </div>
          ) : (
            <div key={index} className="chat-message-container">
              <div className="chat-avatar">
                {msg.user.avatar ? <img src={msg.user.avatar} alt={msg.user.avatar}/> : <p>{msg.user.name?.toUpperCase()[0]}</p>}
              </div>
              <div className="chat-message">
                <p className="chat-text"><p className="chat-user">{msg.user.name}</p>{msg.message}</p>
              </div>
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