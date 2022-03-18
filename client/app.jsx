"use strict";

var React = require("react");
const NodeRSA = require('node-rsa');
const key = new NodeRSA({b: 512});

var socket = io.connect();

var UsersList = React.createClass({
  render() {
    return (
      <ul className="users-list">
        {this.props.users.map((user, i) => {
          return <li key={i}>{user}</li>;
        })}
      </ul>
    );
  },
});

var Message = React.createClass({
  render() {
    return (
      <div className="message">
        <strong>{this.props.user} :</strong>
        <span>{this.props.text}</span>
      </div>
    );
  },
});

var MessageList = React.createClass({
  render() {
    return (
      <ul className="message-area">
        {this.props.messages.map((message, i) => {
          return <Message key={i} user={message.user} text={message.text} />;
        })}
      </ul>
    );
  },
});

var MessageForm = React.createClass({
  getInitialState() {
    return { text: "" };
  },

  handleSubmit(e) {
    e.preventDefault();
    var message = {
      user: this.props.user,
      text: this.state.text,
    };
    this.props.onMessageSubmit(message);
    this.setState({ text: "" });
  },

  changeHandler(e) {
    this.setState({ text: e.target.value });
  },

  render() {
    return (
      <div className="input-area">
        <h4>Escribir mensaje</h4>
        <form onSubmit={this.handleSubmit}>
          <input
            type="text"
            onChange={this.changeHandler}
            value={this.state.text}
          />
          <input type="submit" value="Enviar" />
        </form>
      </div>
    );
  },
});

var ChangeNameForm = React.createClass({
  getInitialState() {
    return { newName: "" };
  },

  onKey(e) {
    this.setState({ newName: e.target.value });
  },

  handleSubmit(e) {
    e.preventDefault();
    var newName = this.state.newName;
    this.props.onChangeName(newName);
    this.setState({ newName: "" });
  },

  render() {
    return (
      <div className="change-name-form">
        <h4>Cambiar nombre</h4>
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.onKey} value={this.state.newName} type="text" />
          <input type="submit" value="Cambiar" />
        </form>
      </div>
    );
  },
});

var ChatApp = React.createClass({
  getInitialState() {
    return { users: [], messages: [], text: "" };
  },

  componentDidMount() {
    socket.on("init", this._initialize);
    socket.on("send:message", this._messageRecieve);
    socket.on("user:join", this._userJoined);
    socket.on("user:left", this._userLeft);
    socket.on("change:name", this._userChangedName);
  },

  _initialize(data) {
    var { users, name } = data;
    this.setState({ users, user: name });
  },

  _messageRecieve(message) {
    var { messages } = this.state;
    messages.push(message);
    this.setState({ messages });
  },

  _userJoined(data) {
    var { users, messages } = this.state;
    var { name } = data;
    users.push(name);
    messages.push({
      user: "APPLICATION BOT",
      text: name + " Joined",
    });
    this.setState({ users, messages });
  },

  _userLeft(data) {
    var { users, messages } = this.state;
    var { name } = data;
    var index = users.indexOf(name);
    users.splice(index, 1);
    messages.push({
      user: "APPLICATION BOT",
      text: name + " Left",
    });
    this.setState({ users, messages });
  },

  _userChangedName(data) {
    var { oldName, newName } = data;
    var { users, messages } = this.state;
    var index = users.indexOf(oldName);
    users.splice(index, 1, newName);
    messages.push({
      user: "APPLICATION BOT",
      text: "Change Name : " + oldName + " ==> " + newName,
    });
    this.setState({ users, messages });
  },

  handleMessageSubmit(message) {
    var { messages } = this.state;
    messages.push(message);
    this.setState({ messages });
    socket.emit("send:message", message);
  },

  handleChangeName(newName) {
    var oldName = this.state.user;
    socket.emit("change:name", { name: newName }, (result) => {
      if (!result) {
        return alert("There was an error changing your name");
      }
      var { users } = this.state;
      var index = users.indexOf(oldName);
      users.splice(index, 1, newName);
      this.setState({ users, user: newName });
    });
  },

  render() {
    return (
      <div className="App">
        <div className="chat-area">
          <h1>Conversación</h1>
          <MessageList messages={this.state.messages} />
          <MessageForm
            onMessageSubmit={this.handleMessageSubmit}
            user={this.state.user}
          />
        </div>
        <div className="users-area">
          <h1>Lista de usuarios</h1>
          <UsersList users={this.state.users} />
          <ChangeNameForm onChangeName={this.handleChangeName} />
        </div>
      </div>
    );
  },
});

React.render(<ChatApp />, document.getElementById("app"));
