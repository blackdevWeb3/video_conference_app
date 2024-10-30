import { useEffect, useRef, useState } from "react";
import "./chat.css";

const Chat = ({user, roomId, socket, msgs}) => {
  const chatMessageRef = useRef(null);
  const [msgText, setMsgText] = useState("");
  
  const sendMessage = () => {
    try {
      if (msgText) {
        socket.current.emit('send-message', {
          roomID: roomId,
          from: socket.current.id,
          user,
          message: msgText.trim()
        });
        setMsgText("");
      }
    } catch (error) {
      console.log('Error in sendMessage', error);
    }
  }

  useEffect(() => {
    if (chatMessageRef.current) {
      chatMessageRef.current.scrollTop = chatMessageRef.current.scrollHeight;
    }
  }, [msgs]);

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={chatMessageRef}>
        {msgs.map((msg, index) => {
          return socket.current.id === msg.from ? (
            <div key={index} className="chat-message user-message">
              <p className="user-text">{msg.message}</p>
            </div>
          ) : (
            <div key={index} className="chat-message">
              <p className="chat-user">{msg.user}</p>
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