import React, { useState, useRef, useEffect } from 'react';
import { IoSend, IoImagesOutline } from "react-icons/io5";

function Chat() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);
  const [waitingText, setwaitingText] = useState(false);
  const [waitingImage, setwaitingImage] = useState(false);

    const generateImage = () => {
        setwaitingImage(true);
        const prompt = `<s>[INST] Write only keywords that could resume the \
            following text, give me only keywords:
            ${JSON.stringify(chatHistory)} [/INST]`;

        fetch('http://localhost:7542/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"prompt": prompt, "n_predict": -1}),
        })
        .then(response => response.json())
        .then(data => {
            console.log("keywords: ", data.content);
            fetch('http://localhost:7543/generate_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({"keywords": data.content}),
            })
            .then(response => response.json())
            .then(data => {
                if (data.file_name !== "undefined") {
                    setChatHistory(prevChatHistory => [...prevChatHistory, { text: `http://localhost:7543/images/${data.file_name}`, sender: 'image' }]);
                }
                setwaitingImage(false);
            });
        });
    }

    const handleSendMessage = () => {
        setChatHistory(prevChatHistory => [...prevChatHistory, { text: message, sender: 'user' }]);
        setMessage('');
        setwaitingText(true);

        const prompt = `<s>[INST] You are a game master of a role play. \
            You need to act as a narrator for simulate dialog for describe \
            scene, etc... but you can't speak for the player. \
            This is the role play history: ${JSON.stringify(chatHistory)}, \
            the player say: ${message}, continue the rp. [/INST]`;

        fetch('http://localhost:7542/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"prompt": prompt, "n_predict": -1}),
        })
        .then(response => response.json())
        .then(data => {
            setChatHistory(prevChatHistory => [...prevChatHistory, { text: data.content, sender: 'server' }]);
            setwaitingText(false);
        });
    };

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    useEffect(() => {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }, [chatHistory]);

    return (
        <div className="chat-container">
            <div className="chat-history">
                {chatHistory.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                    { message.sender === 'image' ? (
                            <div className="message-bubble">
                                <img src={message.text} alt="Generated Image" />
                            </div>
                        ) : (
                            <div>
                                <span className="message-sender">{message.sender === 'user' ? 'You' : 'ImpAI'}</span>
                                <div className="message-bubble">
                                    {message.text.split('\n').map((paragraph, index) => (
                                        <p key={index} className="paragraph">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                </div>
                ))}
                { waitingText && (
                    <div className={`message server`}>
                        <span className="message-sender">Game Master</span>
                        <div className="message-bubble">
                            <div className="loading"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                )}
                <div ref={chatBottomRef} />
            </div>
            <div className="chat-input">
                <div class="tooltip" data-tooltip={waitingImage ? "Generating Image..." : "Generate Image"}>
                    <button onClick={generateImage} disabled={waitingImage}>
                        <IoImagesOutline />
                    </button>
                </div>
                <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleEnter}
                disabled={waitingText}
                placeholder={waitingText ? "Generating Response..." : "Type your action..."}
                />
                <div class="tooltip" data-tooltip={waitingText ? "Generating Response..." : "Send Message"}>
                    <button onClick={handleSendMessage} disabled={waitingText}>
                        <IoSend />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chat;
