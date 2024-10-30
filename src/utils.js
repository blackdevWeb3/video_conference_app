const connectToNewUser = (socket, peerID, addedPeers, call, setPeers) => {
  try {
    socket.current.on("found-user", (user) => {
      // Check if the user is not already added to the peers array
      if (!addedPeers.current.includes(peerID)) {
        const peerObj = {
          peerId: peerID,
          peer: call,
          name: user,
          state: "incoming",
        };
        setPeers((users) => [...users, peerObj]);
        addedPeers.current.push(peerID);
      }
    });
  } catch (error) {
    console.error("Error in connectToNewUser:", error);
  }
};

const getAllUsers = (socket, addedPeers, stream, peer, setPeers) => {
  try {
    socket.current.on("all-users", (users) => {
      const currPeers = [];
      users.forEach((item) => {
        // Check if the user is not already added to the peers array
        if (!addedPeers.current.includes(item.userId)) {
          try {
            const call = peer.call(item.userId, stream);
            currPeers.push({
              peerId: call.peer,
              peer: call,
              name: item.user,
              state: "outgoing",
            });
            addedPeers.current.push(item.userId);
          } catch (callError) {
            console.error("Error while making call:", callError);
          }
        }
      });
      setPeers(currPeers);
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
  }
};

const disconnectUser = (socket, setPeers) => {
  try {
    socket.current.on("user-disconnected", (userID) => {
      setPeers((users) => users.filter((user) => user.peerId !== userID));
    });
  } catch (error) {
    console.error("Error in disconnectUser:", error);
  }
};

const newMessage = (socket, setMsgs) => {
  try {
    socket.current.on("message", (data) => {
      setMsgs((msgs) => [...msgs, data]);
    });
  } catch (error) {
    console.error("Error in newMessage:", error);
  }
};

const socketFunctions = {
  connectToNewUser,
  getAllUsers,
  disconnectUser,
  newMessage,
};

export default socketFunctions;
