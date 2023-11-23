import React, { useEffect, useState } from 'react';
import { IoSettingsOutline, IoClose, IoChatboxEllipses, IoImage } from "react-icons/io5";
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

  const initialPrompt = `<s>[INST] You are a game master of a role play. \
You need to act as a narrator for simulate dialog for describe \
scene, etc... but you can't speak for the player. \
This is the role play history: [CHAT_HISTORY], \
the player say: [MESSAGE], continue the rp. [/INST]`;

  const [userPrompt, setUserPrompt] = useState(
    localStorage.getItem('prompt') ? localStorage.getItem('prompt') : initialPrompt);
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

  return (
    <div className="App">
      <img src={imageUrl} alt="ImpAI" className="logo" onClick={handleClick} />
      <div className={`menu-settings ${isMenuOpen ? 'open' : ''}`}>
        <a onClick={toggleMenu}>
          <br /> 
          {isMenuOpen ? <IoClose className="settingIcon" /> : <IoSettingsOutline className="settingIcon" />}
        </a>
        <ul>
          <li>
            <p><IoChatboxEllipses className="icon" /> Prompt:</p>
            <textarea
                type="text"
                value={userPrompt}
                onChange={e => {
                  setUserPrompt(e.target.value);
                  localStorage.setItem('prompt', e.target.value);
                }}
                placeholder="hello"
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
          </li>
        </ul>
      </div>
      <Chat 
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