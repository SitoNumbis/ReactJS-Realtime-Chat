import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { nanoid } from "nanoid";

import Base62Str from "base62str";
import CryptoJS from "crypto-js";

import "./App.css";

const base62 = Base62Str.createInstance();
const re = nanoid();

const MessageInput = ({ socket }) => {
  const [value, setValue] = useState("");

  const submitForm = (e) => {
    e.preventDefault();
    const text = CryptoJS.AES.encrypt(value, re).toString();
    socket.emit("message", { value: text, key: base62.encodeStr(re) });
    setValue("");
  };

  return (
    <form onSubmit={submitForm}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type="text"
          autoFocus
          value={value}
          placeholder="Type your message"
          onChange={(e) => {
            setValue(e.currentTarget.value);
          }}
        />
        <input type="submit" value="Enviar" />
      </div>
    </form>
  );
};

const Users = ({ socket }) => {
  const [value, setValue] = useState("");
  const [userName, setUserName] = useState("");
  const [usersState, setUsersState] = useState([]);

  useEffect(() => {
    socket.on("init", init);
    return () => {
      socket.off("init", init);
    };
  }, [socket]);

  const init = (data) => {
    const { name, users } = data;
    setUserName(name);
    setUsersState(users);
  };

  const submitForm = (e) => {
    e.preventDefault();
    socket.emit("change:name", { name: value }, (result) => {
      if (!result) return alert("Ha ocurrido un error al cambiar el nombre");

      const users = usersState;
      var index = users.indexOf(userName);
      users.splice(index, 1, value);
      setUsersState(users);
      setUserName(value);
      setValue("");
    });
  };

  return (
    <div className="side-bar">
      <UsersList users={usersState} />
      <form onSubmit={submitForm} style={{ height: 85 }}>
        <label htmlFor="change-name">
          Cambiar nombre (actual: {userName}):
        </label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            id="change-name"
            autoFocus
            value={value}
            placeholder="Ej: Nombre2"
            onChange={(e) => {
              setValue(e.currentTarget.value);
            }}
          />
          <input type="submit" value="Cambiar" />
        </div>
      </form>
    </div>
  );
};

const Messages = ({ socket }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const messageListener = (message) => {
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, message];
        return newMessages;
      });
    };

    const deleteMessageListener = (messageID) => {
      setMessages((prevMessages) => {
        const newMessages = { ...prevMessages };
        delete newMessages[messageID];
        return newMessages;
      });
    };

    socket.on("message", messageListener);
    socket.on("deleteMessage", deleteMessageListener);
    socket.emit("getMessages");

    return () => {
      socket.off("message", messageListener);
      socket.off("deleteMessage", deleteMessageListener);
    };
  }, [socket]);

  return (
    <div className="message-list">
      <h2 style={{ margin: 0 }}>Conversación</h2>
      {messages
        .sort((a, b) => a.time - b.time)
        .map((message, i) => (
          <div
            key={i}
            className="message-container"
            title={`Sent at ${new Date(message.time).toLocaleTimeString()}`}
          >
            {message.user !== undefined && (
              <span className="user">{message.user}:</span>
            )}
            <span className="message">
              {message.key
                ? CryptoJS.AES.decrypt(
                    message.value,
                    base62.decodeStr(message.key)
                  ).toString(CryptoJS.enc.Utf8)
                : message.value}
            </span>
            <span className="date">
              {new Date(message.time).toLocaleTimeString()}
            </span>
          </div>
        ))}
    </div>
  );
};

const UsersList = ({ socket, users }) => {
  return (
    <ul className="users-list">
      <h4 style={{ marginBottom: 10 }}>Usuarios conectados</h4>
      {users.map((user, i) => {
        return <li key={i}>{user}</li>;
      })}
    </ul>
  );
};

const App = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(`http://localhost:3000`);
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);

  return (
    <div className="App">
      {socket ? (
        <>
          <div className="chat-container">
            <Messages socket={socket} />
            <MessageInput socket={socket} />
          </div>
          <Users socket={socket} />
        </>
      ) : (
        <div>Not Connected</div>
      )}
    </div>
  );
};

export default App;
