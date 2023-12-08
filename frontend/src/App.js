import React, { useEffect, useState } from 'react';
import { IoClose, IoReceipt, IoImage, IoReader, IoPersonAdd, IoTrashBin } from "react-icons/io5";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Chat from './components/Chat';
import './App.css';

function App() {
  const npcExemple = "ImpAI is a little AI. He is kawaii and love help everyone."
  const [clickCount, setClickCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('impai.png');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isNPCMenuOpen, setIsNPCMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [width, setWidth] = useState(
    localStorage.getItem('width') ? Number(localStorage.getItem('width')) : 1024);
  const [height, setHeight] = useState(
    localStorage.getItem('height') ? Number(localStorage.getItem('height')) : 512);
  const [steps, setSteps] = useState(
    localStorage.getItem('steps') ? Number(localStorage.getItem('steps')) : 1);
  const [npcList, setNpcList] = useState([]);
  const [npcAvatarList, setNpcAvatarList] = useState([]);

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

  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen(!isSettingsMenuOpen);
    setIsNPCMenuOpen(false);
  };

  const toggleNPCMenu = () => {
    setIsNPCMenuOpen(!isNPCMenuOpen);
    setIsSettingsMenuOpen(false);
  };

  const handleClick = () => {
    setClickCount((prevClickCount) => prevClickCount + 1);

    if (clickCount === 9) {
      setImageUrl('angry_impai.png');
    }
  };

  const addNpc = () => {
    setNpcList((prevNpcList) => [
      ...prevNpcList, 
      npcExemple
    ]);
  }

  const editNpc = (index, newValue) => {
    setNpcList((prevNpcList) => {
      const updatedNpcList = [...prevNpcList];
      updatedNpcList[index] = newValue;
      return updatedNpcList;
    });
  };

  const deleteNpc = (index) => {
    setNpcList((prevNpcList) => {
      const updatedNpcList = [...prevNpcList];
      updatedNpcList.splice(index, 1);
      return updatedNpcList;
    });
  };

  const generateImageNpc = (index) => {
        const imagePrompt = `<s>[INST] Extract the most important words \
from your paragraph and list them as keywords, separated \
by commas. For example:\nParagraph: A young woman with long curly hair, \
wearing a red dress, and standing in front of a sunset. \
\nKeywords: young, woman, long curly hair, red dress, standing in front of a sunset \
\nThis is the paragraph you need to describe with keywords: \
${JSON.stringify(npcList[index])} [/INST]`;

    fetch('http://localhost:7542/completion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({"prompt": imagePrompt, "n_predict": -1}),
    })
    .then(response => response.json())
    .then(data => {
        console.log("keywords: ", data.content);
        fetch('http://localhost:7543/generate_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"keywords": data.content, width: 512, height: 512, steps: steps}),
        })
        .then(response => response.json())
        .then(data => {
          const newArray = [...npcAvatarList];
          newArray[index] = `http://localhost:7543/images/${data.file_name}`;
          setNpcAvatarList(newArray);
        })
        .catch(error => {
            console.error(`Error fetching generated image: ${error.message}`);
            toast.error("Error with the backend !", {
                theme: "dark"
            });
        });
    })
    .catch(error => {
        console.error(`Error fetching completion: ${error.message}`);
        toast.error("Error with llama.cpp server !", {
            theme: "dark"
        });
    });
  }

  useEffect(() => {
    const filteredChatHistory = chatHistory.filter((item) => item.sender !== "image");

    setPrompt(userPrompt
      .replace('[CHAT_HISTORY]', JSON.stringify(filteredChatHistory))
      .replace('[MESSAGE]', message));
  }, [userPrompt, chatHistory, message])

  useEffect(() => {
    setFirstPrompt(firstUserPrompt
      .replace('[MESSAGE]', message));
  }, [firstUserPrompt, message])

  useEffect(() => {
    console.log("npc avatar generated !");
  }, [npcAvatarList])

  return (
    <div>
      <ToastContainer limit={3} />
      <img src={imageUrl} alt="ImpAI" className="logo" onClick={handleClick} />
      <div className={`menu-settings ${isSettingsMenuOpen ? 'open' : ''}`}>
        <a onClick={toggleSettingsMenu}>
          {isSettingsMenuOpen ? <IoClose className="icon-settings" /> : <img src="worker_impai.png" alt="S" className="icon-impai-head" />}
        </a>
        <div>
          <p><IoReader className="icon" /> Root Prompt:</p>
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
          <p><IoReceipt className="icon" /> Prompt:</p>
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
          <br/>
          <div className="align-items">
            <p>Steps:</p>
            <input
              type="number" 
              value={steps} 
              onChange={e => {
                setSteps(Number(e.target.value));
                localStorage.setItem('steps', Number(e.target.value));
              }}
            />
          </div>
        </div>
      </div>
      <div className={`menu-npc ${isNPCMenuOpen ? 'open' : ''}`}>
        <a onClick={toggleNPCMenu}>
          {isNPCMenuOpen ? <IoClose className="icon-npc" /> : <img src="astro_impai.png" alt="C" className="icon-impai-head" />}
        </a>
        <div>
          <div onClick={addNpc} className="create-npc">
            <div className="align-items">
              <IoPersonAdd className="icon-user" />
              Create Character
              <beta>BETA</beta>
            </div>
          </div>
          <br />
          {npcList.map((npc, index) => (
            <div style={{padding: "10px"}} key={index}>
              <div className="align-items">
                <img src={npcAvatarList[index] ? npcAvatarList[index] : "soldier_impai.png"} alt="ImpAI" className="avatar" onClick={handleClick} />
                <textarea
                  type="text"
                  value={npc}
                  onChange={(e) => editNpc(index, e.target.value)}
                  placeholder={npcExemple}
                />
              </div>
              <div className="align-items" style={{paddingLeft: "20px"}}>
                <div className="tooltip" data-tooltip="Generate Image">
                  <button 
                    className="icon-user"
                    onClick={() => generateImageNpc(index)}
                  >
                    <IoImage />
                  </button>
                </div>
                <div className="tooltip" data-tooltip="Delete Character">
                  <button 
                    className="icon-user"
                    onClick={() => deleteNpc(index)}
                  >
                    <IoTrashBin />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Chat
        {...{
          firstPrompt,
          prompt,
          message,
          setMessage,
          chatHistory,
          setChatHistory,
          width,
          height,
          steps,
          npcList,
        }}
      />
    </div>
  );
}

export default App;