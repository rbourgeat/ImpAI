import React, { useState } from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import Chat from './components/Chat';
import './App.css';

function App() {
  const [clickCount, setClickCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('impai.png');

  const handleClick = () => {
    setClickCount((prevClickCount) => prevClickCount + 1);

    if (clickCount === 9) {
      setImageUrl('angry_impai.png');
    }
  };

  return (
    <div className="App">
      <img src={imageUrl} alt="ImpAI" className="logo" onClick={handleClick} />
      <IoSettingsOutline className="settingIcon" />
      <Chat />
    </div>
  );
}

export default App;