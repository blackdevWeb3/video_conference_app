
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import { getRandomString } from "../utils";

const uuid = v4();

const Home = () => {
  const [id, setId] = useState("");
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <button
        onClick={() => {
          navigate(`/conference/${uuid}`, {state:{host:true, name:"Host"}});
        }}
      >Create conference</button>
      <input type="text" placeholder="Enter conference ID" onChange={(e) => setId(e.target.value)} value={id} />
      <button
        onClick={() => {
          navigate(`/conference/${id}`, {state:{host:false, name: getRandomString()}});
        }}
      >Join conference</button>
    </div>
  )
}
export default Home;