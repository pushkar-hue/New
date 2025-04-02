import React from 'react';
import Chat from '../components/Chat';
import './ChatInterface.css';

const ChatInterface = () => {
  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h1>Medical AI Assistant</h1>
        <p>Ask questions about medical conditions, symptoms, or how to use our diagnostic tools</p>
      </div>
      <Chat />
    </div>
  );
};

export default ChatInterface;