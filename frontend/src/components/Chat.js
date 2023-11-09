import React, { useState, useRef, useEffect } from 'react';

function Chat() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);
  const [waiting, setWaiting] = useState(false);

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
                    <span className="message-sender">{message.sender === 'user' ? 'You' : 'Game Master'}</span>
                    <div className="message-bubble">
                        {message.text.split('\n').map((paragraph, index) => (
                            <p key={index} className="paragraph">
                                {paragraph}
                            </p>
                        ))}
                    </div>
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
                placeholder="Type your message..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
}

export default Chat;
