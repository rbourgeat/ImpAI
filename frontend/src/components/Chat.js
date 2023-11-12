import React, { useState, useRef, useEffect } from 'react';

function Chat() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);
  const [waiting, setWaiting] = useState(false);

    const generateImage = (currentChatHistory) => {
        const prompt = `<s>[INST] Write only keywords that could resume the \
            following text, give me only keywords:
            ${JSON.stringify(currentChatHistory)} [/INST]`;

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
                console.log(data.file_name);
                setChatHistory(prevChatHistory => [...prevChatHistory, { text: `http://localhost:7543/images/${data.file_name}`, sender: 'image' }]);
            });
        });
    }

    const handleSendMessage = () => {
        setChatHistory(prevChatHistory => [...prevChatHistory, { text: message, sender: 'user' }]);
        setMessage('');
        setWaiting(true);

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
            setWaiting(false);
            generateImage([...chatHistory, { text: data.content, sender: 'server' }]);
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
                                <span className="message-sender">{message.sender === 'user' ? 'You' : 'Game Master'}</span>
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
                { waiting && (
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
                <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleEnter}
                disabled={waiting}
                placeholder="Type your action..."
                />
                <button onClick={handleSendMessage} disabled={waiting}>Send</button>
            </div>
        </div>
    );
}

export default Chat;
