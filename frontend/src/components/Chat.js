import React, { useState, useRef, useEffect } from 'react';
import { IoSend, IoImagesOutline } from "react-icons/io5";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Chat({
    firstPrompt,
    prompt,
    message,
    setMessage,
    chatHistory,
    setChatHistory,
    width,
    height,
    npcList
}) {
  const chatBottomRef = useRef(null);
  const [waitingText, setwaitingText] = useState(false);
  const [waitingImage, setwaitingImage] = useState(false);

    const generateImage = () => {
        setwaitingImage(true);
        const imagePrompt = `<s>[INST] Write a short paragraph describing \
a scene or an object that you want to see as an image. Use descriptive words \
and phrases that capture the details and the mood of your vision. Then, extract \
the most important words from your paragraph and list them as keywords, separated \
by commas. For example:\nParagraph: I imagine a peaceful forest at dawn, with \
rays of sunlight filtering through the branches of the trees. The air is fresh \
and crisp, and the birds are singing softly. The leaves are green and moist, and \
the ground is covered with flowers and mushrooms. A small stream runs through the \
forest, creating a soothing sound.\nKeywords: forest, dawn, sunlight, trees, birds, \
leaves, flowers, mushrooms, stream.\nThis is the scene you need to describe with keywords: \
${JSON.stringify(chatHistory)} [/INST]`;

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
                body: JSON.stringify({"keywords": data.content, width: width, height: height}),
            })
            .then(response => response.json())
            .then(data => {
                if (data.file_name !== "undefined") {
                    setChatHistory(prevChatHistory => [...prevChatHistory, { text: `http://localhost:7543/images/${data.file_name}`, sender: 'image' }]);
                }
                setwaitingImage(false);
            })
            .catch(error => {
                console.error(`Error fetching generated image: ${error.message}`);
                setwaitingImage(false);
                toast.error("Error with the backend !", {
                    theme: "dark"
                });
            });
        })
        .catch(error => {
            console.error(`Error fetching completion: ${error.message}`);
            setwaitingImage(false);
            toast.error("Error with llama.cpp server !", {
                theme: "dark"
            });
        });
    }

    const handleSendMessage = () => {
        setChatHistory(prevChatHistory => [...prevChatHistory, { text: message, sender: 'user' }]);
        setMessage('');
        setwaitingText(true);

        const realPrompt = chatHistory.length === 0 ? firstPrompt : prompt;
        const addNpcToPrompt = [...realPrompt, " and you must take into account the following non player characters: ", ...npcList.join(' ')];
        const updatedPrompt = npcList.length > 0 ? addNpcToPrompt.join('') : realPrompt;

        console.log(updatedPrompt);

        fetch('http://localhost:7542/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"prompt": updatedPrompt, "n_predict": -1}),
        })
        .then(response => response.json())
        .then(data => {
            setChatHistory(prevChatHistory => [...prevChatHistory, { text: data.content, sender: 'server' }]);
            setwaitingText(false);
        })
        .catch(error => {
            setwaitingText(false);
            console.error(`Error fetching completion: ${error.message}`);
            toast.error("Error with llama.cpp server !", {
                theme: "dark"
            });
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
        <div>
            <div className="chat-container">
            <ToastContainer limit={3} />
                <div className="chat-history">
                    {chatHistory.map((message, index) => (
                    <div key={index} className={`message ${message.sender}`}>
                        { message.sender === 'image' ? (
                                <div className="message-bubble">
                                    <img src={message.text} alt="If it don't render, check logs and open issue :)" />
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
                            <span className="message-sender">ImpAI</span>
                            <div className="message-bubble">
                                <div className="loading"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatBottomRef} />
                </div>
                <div className="chat-input">
                    <div className="tooltip" data-tooltip={waitingImage ? "Generating Image..." : "Generate Image"}>
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
                    <div className="tooltip" data-tooltip={waitingText ? "Generating Response..." : "Send Message"}>
                        <button onClick={handleSendMessage} disabled={waitingText}>
                            <IoSend />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chat;
