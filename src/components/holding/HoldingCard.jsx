import { MdCheck } from "react-icons/md";
import "./holding.css";
import { RxCross2 } from "react-icons/rx";

const HoldingCard = ({holdingUsers, allow, reject, allowAll}) => {
  return (
    <div className="holding-card" style={{display: holdingUsers.length > 0?"flex":"none"}}>
      <p>Someone want to join:</p>
      {holdingUsers.map((holder, index) => (
        <div key={index} className="holding-item">
          <label>{holder.user.name}</label>
          <div className="item-button">
            <button onClick={() => {
              allow(holder)
            }}><MdCheck color="green"/></button>
            <button onClick={() => {
              reject(holder)
            }}><RxCross2 color="red"/></button>
          </div>
        </div>
      ))}
      <hr></hr>
      <button onClick={() => {
        allowAll()
      }}>Allow all</button>
    </div>
  );
}

export default HoldingCard;