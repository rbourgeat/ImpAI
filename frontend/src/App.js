import React, { useEffect, useState } from 'react';
import { IoSettingsOutline, IoClose, IoChatboxEllipses, IoImage, IoCreate } from "react-icons/io5";
import Chat from './components/Chat';
import './App.css';

function App() {
  const [clickCount, setClickCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('impai.png');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [width, setWidth] = useState(
    localStorage.getItem('width') ? Number(localStorage.getItem('width')) : 1024);
  const [height, setHeight] = useState(
    localStorage.getItem('height') ? Number(localStorage.getItem('height')) : 512);

  const defaultFirstPrompt = `<s>[INST] You are a game master of a role play. \
You need to act as a narrator for simulate the beginning of the story. \
Just describe the situation and dont speak for the player. \
This is the story theme: [MESSAGE], write the beginning of \
the story using this information. [/INST]`;

  const [firstUserPrompt, setFirstUserPrompt] = useState(
    localStorage.getItem('firstPrompt') ? localStorage.getItem('firstPrompt') : defaultFirstPrompt);
  const [firstPrompt, setFirstPrompt] = useState(firstUserPrompt
    .replace('[MESSAGE]', message));

  const defaultPrompt = `<s>[INST] You are a game master of a role play. \
You need to act as a narrator for simulate dialog, describe \
scene, etc... but don't write player dialogue. \
This is the role play history: [CHAT_HISTORY], \
the player say: [MESSAGE], continue the rp. [/INST]`;

  const [userPrompt, setUserPrompt] = useState(
    localStorage.getItem('prompt') ? localStorage.getItem('prompt') : defaultPrompt);
  const [prompt, setPrompt] = useState(userPrompt
    .replace('[CHAT_HISTORY]', JSON.stringify(chatHistory))
    .replace('[MESSAGE]', message));

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClick = () => {
    setClickCount((prevClickCount) => prevClickCount + 1);

    if (clickCount === 9) {
      setImageUrl('angry_impai.png');
    }
  };

  useEffect(() => {
    setPrompt(userPrompt
      .replace('[CHAT_HISTORY]', JSON.stringify(chatHistory))
      .replace('[MESSAGE]', message));
  }, [userPrompt, chatHistory, message])

  useEffect(() => {
    setFirstPrompt(firstUserPrompt
      .replace('[MESSAGE]', message));
  }, [firstUserPrompt, message])

  return (
    <div className="App">
      <img src={imageUrl} alt="ImpAI" className="logo" onClick={handleClick} />
      <div className={`menu-settings ${isMenuOpen ? 'open' : ''}`}>
        <a onClick={toggleMenu}>
          {isMenuOpen ? <IoClose className="settingIcon" /> : <IoSettingsOutline className="settingIcon" />}
        </a>
        <div>
          <p><IoCreate className="icon" /> Root Prompt:</p>
          <textarea
              type="text"
              value={firstUserPrompt}
              onChange={e => {
                setFirstUserPrompt(e.target.value);
                localStorage.setItem('firstPrompt', e.target.value);
              }}
              placeholder={defaultFirstPrompt}
          />
          <br/>
          <p><IoChatboxEllipses className="icon" /> Prompt:</p>
          <textarea
              type="text"
              value={userPrompt}
              onChange={e => {
                setUserPrompt(e.target.value);
                localStorage.setItem('prompt', e.target.value);
              }}
              placeholder={defaultPrompt}
          />
          <br/>
          <p><IoImage className="icon" /> Images Settings:</p>
          <div className="align-items">
            <p>Width:</p>
            <input 
              type="number" 
              value={width} 
              onChange={e => {
                setWidth(Number(e.target.value));
                localStorage.setItem('width', Number(e.target.value));
              }}
            />
            <br/>
            <p>Height:</p>
            <input 
              type="number" 
              value={height} 
              onChange={e => {
                setHeight(Number(e.target.value));
                localStorage.setItem('height', Number(e.target.value));
              }}
            />
          </div>
        </div>
      </div>
      <Chat
        firstPrompt={firstPrompt}
        prompt={prompt}
        message={message}
        setMessage={setMessage}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        width={width}
        height={height}
      />
    </div>
  );
}

export default App;