import { useState, useRef, useEffect } from "react";

// Phrases that Brinky can say when interacting with him
const brinkyPhrases = [
  "Hello! How can I help you today?",
  "Need help with your displays?",
  "I can help you manage your displays!",
  "Having trouble with Blue Vision? I'm here to help.",
  "Looking to send a message to your displays?",
  "Need help configuring the Xibo API?",
  "I can show you how to automatically authorize your displays.",
  "Have questions about the interface?",
  "I'm Brinky, your digital signage management assistant!"
];

export default function BrinkyAssistant() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const brinkyRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [userMessage, setUserMessage] = useState("");
  const [conversation, setConversation] = useState<{ type: 'user' | 'brinky', text: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Effet pour l'animation de frappe
  useEffect(() => {
    if (open && !isTyping) {
      setIsTyping(true);
      setTypedText("");

      const phrase = brinkyPhrases[currentPhrase];
      let index = 0;

      const typingInterval = setInterval(() => {
        if (index < phrase.length) {
          setTypedText(prev => prev + phrase[index]);
          index++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 30);

      return () => clearInterval(typingInterval);
    }
  }, [open, currentPhrase]);

  // Effet pour suivre la position de la souris pour les yeux
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (brinkyRef.current) {
        const rect = brinkyRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculer la direction relative (limitée à un petit mouvement)
        const maxMove = 3;
        const deltaX = Math.max(-maxMove, Math.min(maxMove, (e.clientX - centerX) / 20));
        const deltaY = Math.max(-maxMove, Math.min(maxMove, (e.clientY - centerY) / 20));

        setEyePosition({ x: deltaX, y: deltaY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Effet pour faire défiler automatiquement la conversation vers le bas
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Gestion des interactions
  const handleMouseEnter = () => {
    setHover(true);
  };

  const handleMouseLeave = () => {
    setHover(false);
    setClicked(false);
  };

  const handleClick = () => {
    // Pas de clignotement ou de saut au clic
    setOpen(!open);

    if (!open) {
      setCurrentPhrase(Math.floor(Math.random() * brinkyPhrases.length));
    }
  };

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    // Ajouter le message de l'utilisateur à la conversation
    setConversation([...conversation, { type: 'user', text: userMessage }]);

    // Réinitialiser le champ de saisie
    setUserMessage("");

    // Simuler une réponse de Brinky après un court délai
    setTimeout(() => {
      const responses = [
        "I understand your question. Let me help you with that.",
        "Good question! Here's what I can tell you about it...",
        "I'll help you solve this problem.",
        "That's an excellent question. Here is some information that might be useful to you.",
        "I'm here to help you. Here's what I suggest..."
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setConversation(prev => [...prev, { type: 'brinky', text: randomResponse }]);
    }, 1000);

    // Focus sur le champ de saisie après l'envoi
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Brinky Button with improved animations */}
      <div
        ref={brinkyRef}
        className="fixed z-50 bottom-8 right-8 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 shadow-2xl rounded-full flex items-center justify-center cursor-pointer border-4 border-white transition-all duration-300"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          boxShadow: hover
            ? '0 10px 40px 0 rgba(80, 0, 200, 0.35)'
            : '0 8px 32px 0 rgba(80, 0, 200, 0.25)',
          transform: 'scale(1)' // Suppression de l'effet de saut/clignotement
        }}
      >
        {/* Animated Face with mouse tracking */}
        <svg width="60" height="60" viewBox="0 0 60 60">
          <defs>
            <radialGradient id="faceGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor="#f5f3ff" />
            </radialGradient>
          </defs>

          {/* Face background with subtle gradient */}
          <circle cx="30" cy="30" r="28" fill="url(#faceGradient)" stroke="#a78bfa" strokeWidth="2" />

          {/* Eyes that follow mouse */}
          <g transform={`translate(${eyePosition.x}, ${eyePosition.y})`}>
            <ellipse cx="21" cy="28" rx="4" ry={hover ? "5" : "6"} fill="#6366f1" />
            <ellipse cx="39" cy="28" rx="4" ry={hover ? "5" : "6"} fill="#6366f1" />
          </g>

          {/* Smile that changes with hover */}
          <path
            d={hover ? "M20 38 Q30 50 40 38" : "M20 38 Q30 46 40 38"}
            stroke="#6366f1"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Blush that intensifies on hover */}
          <ellipse cx="16" cy="36" rx="2" ry="1" fill="#fbbf24" opacity={hover ? "0.9" : "0.7"} />
          <ellipse cx="44" cy="36" rx="2" ry="1" fill="#fbbf24" opacity={hover ? "0.9" : "0.7"} />
        </svg>

        {/* Brinky Name Tag with improved styling */}
        <span className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full shadow-md transition-all duration-300">
          Brinky
        </span>
      </div>

      {/* Chat Popup with improved UI and real interaction */}
      {open && (
        <div className="fixed z-50 bottom-32 right-8 w-96 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-indigo-200 animate-fade-in flex flex-col max-h-[70vh]">
          <div className="flex items-center gap-2 p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-t-2xl">
            <svg width="32" height="32" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="28" fill="#fff" stroke="#a78bfa" strokeWidth="2" />
              <g transform={`translate(${eyePosition.x / 2}, ${eyePosition.y / 2})`}>
                <ellipse cx="21" cy="28" rx="4" ry="6" fill="#6366f1" />
                <ellipse cx="39" cy="28" rx="4" ry="6" fill="#6366f1" />
              </g>
              <path d="M20 38 Q30 48 40 38" stroke="#6366f1" strokeWidth="3" fill="none" strokeLinecap="round" />
              <ellipse cx="16" cy="36" rx="2" ry="1" fill="#fbbf24" opacity="0.7" />
              <ellipse cx="44" cy="36" rx="2" ry="1" fill="#fbbf24" opacity="0.7" />
            </svg>
            <span className="font-bold text-indigo-700 text-lg">Brinky</span>
            <span className="ml-auto text-xs text-indigo-400">Assistant IA</span>
            <button
              className="ml-2 text-indigo-400 hover:text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-100 transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
            >
              ×
            </button>
          </div>

          {/* Chat messages container with scrolling */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 flex flex-col gap-3 bg-white overflow-y-auto"
            style={{ maxHeight: "50vh" }}
          >
            {/* Initial greeting message with typing animation */}
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8">
                <svg width="32" height="32" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="28" fill="#fff" stroke="#a78bfa" strokeWidth="2" />
                  <ellipse cx="21" cy="28" rx="4" ry="6" fill="#6366f1" />
                  <ellipse cx="39" cy="28" rx="4" ry="6" fill="#6366f1" />
                  <path d="M20 38 Q30 48 40 38" stroke="#6366f1" strokeWidth="3" fill="none" />
                </svg>
              </div>
              <div className="bg-indigo-50 px-4 py-3 rounded-2xl text-indigo-900 shadow-sm text-sm">
                {typedText}
                {isTyping && <span className="inline-block animate-pulse">|</span>}
              </div>
            </div>

            {/* Conversation history */}
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {message.type === 'brinky' && (
                  <div className="flex-shrink-0 w-8 h-8">
                    <svg width="32" height="32" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="28" fill="#fff" stroke="#a78bfa" strokeWidth="2" />
                      <ellipse cx="21" cy="28" rx="4" ry="6" fill="#6366f1" />
                      <ellipse cx="39" cy="28" rx="4" ry="6" fill="#6366f1" />
                      <path d="M20 38 Q30 48 40 38" stroke="#6366f1" strokeWidth="3" fill="none" />
                    </svg>
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm text-sm max-w-[80%] ${message.type === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-900'
                    }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* User input that actually works */}
          <div className="flex items-center gap-2 p-4 border-t border-indigo-100">
            <input
              ref={chatInputRef}
              className="flex-1 rounded-xl border border-indigo-200 px-4 py-2 text-sm bg-white text-indigo-900 placeholder:text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
              placeholder="Tapez votre message..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className={`bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all ${!userMessage.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                }`}
              onClick={handleSendMessage}
              disabled={!userMessage.trim()}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
