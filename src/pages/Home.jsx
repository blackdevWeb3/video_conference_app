
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

const roomId = uuid();

const Home = () => {
  const [id, setId] = useState("");
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <button
        onClick={() => {
          navigate(`/conference/${roomId}`);
        }}
      >Create conference</button>
      <input type="text" placeholder="Enter conference ID" onChange={(e) => setId(e.target.value)} value={id} />
      <button
        onClick={() => {
          navigate(`/conference/${id}`);
        }}
      >Join conference</button>
    </div>
  )
}
export default Home;