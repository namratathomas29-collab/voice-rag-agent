import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import VoiceOrb from "./components/VoiceOrb";
import "./App.css";

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [orbState, setOrbState] = useState("idle");
  const [savedAnswers, setSavedAnswers] = useState([]);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [isSavedAnswerOpen, setIsSavedAnswerOpen] = useState(false);
  const [displayedAnswer, setDisplayedAnswer] = useState("");

  // Call state: "idle" | "connecting" | "active"
  const [callStatus, setCallStatus] = useState("idle");
  const [callSeconds, setCallSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const connectTimer = useRef(null);
  const tickTimer = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("astra_saved_answers");

    if (saved) {
      setSavedAnswers(JSON.parse(saved));
    }
  }, []);

  // Drive the "connecting -> active" transition and the live call timer.
  useEffect(() => {
    if (callStatus === "connecting") {
      connectTimer.current = setTimeout(() => setCallStatus("active"), 2200);
    }
    if (callStatus === "active") {
      tickTimer.current = setInterval(
        () => setCallSeconds((s) => s + 1),
        1000
      );

      // Start listening automatically when call connects
      setTimeout(() => {
        startVoiceRecognition();
      }, 1000);
    }
    return () => {
      clearTimeout(connectTimer.current);
      clearInterval(tickTimer.current);
    };
  }, [callStatus]);

  useEffect(() => {

    if (!answer) {
      setDisplayedAnswer("");
      return;
    }

    setDisplayedAnswer("");

    let index = 0;

    const interval = setInterval(() => {

      setDisplayedAnswer(
        answer.slice(0, index)
      );

      index++;

      if (index > answer.length) {
        clearInterval(interval);
      }

    }, 15);

    return () => clearInterval(interval);

  }, [answer]);

  const startCall = () => {
    setCallSeconds(0);
    setMuted(false);

    setOrbState("listening");

    setCallStatus("connecting");
  };

  const endCall = () => {
    setCallStatus("idle");
    setCallSeconds(0);
  };

  const formatTime = (total) => {
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const saveAnswer = () => {
    console.log("Saving...");

    if (!answer) {
      console.log("No answer found");
      return;
    }

    const newAnswer = {
      id: Date.now(),
      question,
      answer,
      savedAt: new Date().toLocaleString()
    };
    const alreadySaved = savedAnswers.some(
      saved =>
        saved.question === question &&
        saved.answer === answer
    );

    if (alreadySaved) return;

    console.log(newAnswer);

    const updated = [newAnswer, ...savedAnswers];

    setSavedAnswers(updated);

    localStorage.setItem(
      "astra_saved_answers",
      JSON.stringify(updated)
    );

    console.log("Saved successfully");
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const uploadPDF = async () => {
    if (!selectedFile) {
      alert("Please select a PDF first");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await fetch("http://127.0.0.1:8000/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("[v0] upload error:", error);
      alert("PDF upload failed");
    }
  };

  const speakAnswer = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();

    // Hindi / Marathi
    if (/[\u0900-\u097F]/.test(text)) {

      const hindiVoice = voices.find(
        voice => voice.lang === "hi-IN"
      );

      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      utterance.lang = "hi-IN";
    }
    else {
      utterance.lang = "en-IN";
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setOrbState("idle");

      if (callStatus === "active") {
        setTimeout(() => {
          startVoiceRecognition();
        }, 500);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setOrbState("listening");

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      setQuestion(transcript);

      setTimeout(() => {
        askQuestion(transcript);
      }, 500);
    };

    recognition.onerror = () => {
      setOrbState("idle");
    };

    recognition.onend = () => {
      setOrbState("idle");
    };
  };

  const askQuestion = async (spokenQuestion = null) => {
    window.speechSynthesis.cancel();
    console.log("ASK BUTTON CLICKED");

    const currentQuestion =
      typeof spokenQuestion === "string"
        ? spokenQuestion
        : question;

    if (!currentQuestion.trim()) return;
    setLoading(true);
    setOrbState("thinking");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/ask?question=${encodeURIComponent(currentQuestion)}`
      );
      const data = await response.json();

      setAnswer(data.answer);
      setIsSavedAnswerOpen(false);
      setSource(data.source);
      setOrbState("speaking");

      speakAnswer(data.answer);
    } catch (error) {
      console.error("[v0] ask error:", error);
      const fallback =
        "Aerodynamics is the branch of dynamics concerned with the study of air motion.";

      setAnswer(fallback);
      setOrbState("speaking");
      speakAnswer(fallback);
    }
    setLoading(false);
  };
  const openSavedAnswer = (item) => {
    window.speechSynthesis.cancel();

    setAnswer(item.answer);

    setQuestion(item.question);

    setSource("Saved Response");

    setIsSavedAnswerOpen(true);

    setShowSavedDrawer(false);

    setOrbState("thinking");

    setTimeout(() => {
      setOrbState("idle");
    }, 1500);

  };

  const deleteSaved = (id) => {

    const updated =
      savedAnswers.filter(
        item => item.id !== id
      );

    setSavedAnswers(updated);

    localStorage.setItem(
      "astra_saved_answers",
      JSON.stringify(updated)
    );
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") askQuestion();
  };

  return (
    <div className="app">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img
            src="/astra-logo.png"
            alt="Astra"
            className="sidebar-logo"
            onClick={() => setShowSavedDrawer(!showSavedDrawer)}
          />
        </div>

        <div className="menu-card">
          <h3>Knowledge Base</h3>
          <p>Documents Loaded</p>
          <span className="status status-green">● Connected</span>
        </div>

        <div className="menu-card">
          <h3>AI Engine</h3>
          <p>Whisper + Gemini</p>
          <span className="status status-green">● Active</span>
        </div>

        <div className="menu-card">
          <h3>Upload Files</h3>
          <input
            id="pdfUpload"
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <label htmlFor="pdfUpload" className="select-pdf-btn">
            <span className="icon">📄</span> Select PDF
          </label>
          <button className="upload-btn" onClick={uploadPDF}>
            Upload PDF
          </button>
        </div>

        <div className="menu-card">
          <h3>Talk to Astra</h3>
          <p>Start a live voice call</p>
          <button className="call-btn" onClick={startCall}>
            <span className="call-btn-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            Call Me
          </button>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className="main">
        <header className="header">
          <h1 className="title">Astra</h1>
          <p className="tagline">Multilingual Voice RAG Assistant</p>
          <p className="subtitle">
            Powered by <span className="g-gemini">Gemini</span> •{" "}
            <span className="g-whisper">Whisper</span> •{" "}
            <span className="g-chroma">ChromaDB</span>
          </p>
        </header>

        <section className="astra-center">
          <div className="orb-container">
            <VoiceOrb state={orbState} size={300} />

            {answer ? (
              <div className="energy-response">
                <div className="lightning lightning-left" />
                <div className="lightning lightning-right" />
                <div className="glass-card">
                  <div className="answer-header">
                    <div className="header-left">
                      <img
                        src="/astra-logo.png"
                        alt="Astra"
                        className="astra-logo"
                      />
                      <span>Astra Response</span>
                    </div>
                    <button
                      className={`favorite-btn ${savedPulse || isSavedAnswerOpen ? "saved" : ""
                        }`}
                      onClick={() => {
                        saveAnswer();

                        setSavedPulse(true);

                        setTimeout(() => {
                          setSavedPulse(false);
                        }, 1500);
                      }}
                    >
                      {isSavedAnswerOpen || savedPulse ? "❤️" : "♡"}
                    </button>
                  </div>
                  <div className="answer-content">{displayedAnswer}</div>
                  <div className="answer-source">
                    <span className="src-icon">📑</span>
                    Source: {source || "Unknown Source"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="orb-status">
                <h2></h2>
              </div>
            )}
          </div>

          <p className="voice-status">
            <span className="mic-dot">🎙</span>{" "}
            {loading ? "Processing your question..." : "Listening for your voice..."}
          </p>
        </section>

        <div className="input-section">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask anything..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="ask-btn" onClick={askQuestion}>
            Ask
          </button>
          <button
            className="voice-btn"
            aria-label="Voice input"
            onClick={startVoiceRecognition}
          >
            🎤
          </button>
        </div>
      </main>

      {/* ===== Full-screen Call Overlay ===== */}
      {callStatus !== "idle" && (
        <div className="call-overlay">
          <div className="call-backdrop" />

          <div className="call-content">
            <p className="call-status-label">
              {callStatus === "connecting" ? "Connecting…" : "In Call"}
            </p>

            <div
              className={`call-orb ${callStatus === "connecting" ? "is-connecting" : "is-active"
                }`}
            >
              <span className="call-ring call-ring-1" />
              <span className="call-ring call-ring-2" />
              <span className="call-ring call-ring-3" />
              <div className="call-orb-core">
                <img
                  src="/astra-logo.png"
                  alt="Astra"
                  className="call-orb-logo"
                />
              </div>
            </div>

            <h2 className="call-name">Astra</h2>
            <p className="call-timer">
              {callStatus === "connecting"
                ? "Ringing…"
                : formatTime(callSeconds)}
            </p>

            {callStatus === "active" && (
              <div className="call-visualizer" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className="viz-bar"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            )}

            <div className="call-actions">
              <button
                className={`call-action mute ${muted ? "active" : ""}`}
                onClick={() => {
                  setMuted((m) => !m);

                  window.speechSynthesis.cancel();

                  setOrbState("idle");
                }}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {muted ? (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </>
                  )}
                </svg>
                <span>{muted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                className="call-action end"
                onClick={endCall}
                aria-label="End call"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.66-1.85.998.998 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
                <span>End</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {showSavedDrawer && (
        <div
          className="drawer-overlay"
          onClick={() => setShowSavedDrawer(false)}
        />
      )}
      {showSavedDrawer && (
        <div className="saved-drawer">

          <div className="saved-header">
            ★ Saved Responses
          </div>

          {savedAnswers.length === 0 ? (
            <p>No saved answers yet</p>
          ) : (
            savedAnswers.map((item, index) => (
              <motion.div
                key={item.id}
                className="saved-item"

                drag="x"

                dragConstraints={{
                  left: -140,
                  right: 140
                }}

                dragSnapToOrigin={true}

                whileHover={{
                  scale: 1.03
                }}

                onDragEnd={(e, info) => {
                  console.log("Drag:", info.offset.x);

                  if (info.offset.x < -60) {
                    openSavedAnswer(item);
                  }

                  if (info.offset.x > 60) {
                    deleteSaved(item.id);
                  }

                }}
              >
                <h4>{item.question}</h4>

                <p>
                  {item.answer.slice(0, 120)}...
                </p>

                <small>
                  {item.savedAt}
                </small>

              </motion.div>
            ))
          )}

        </div>
      )}
      {showToast && (
        <div className="save-toast">
          ★ Answer Saved
        </div>
      )}
    </div>
  );
}
