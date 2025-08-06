import React, { useEffect, useState, useRef } from "react";
import SudokuBoard from "./SudokuBoard";
import "./App.css";

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function App() {
  const [boardStr, setBoardStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef();

    // Timer logic
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds(sec => sec + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const resetTimer = () => {
    setSeconds(0);
  };

  useEffect(() => {
    fetch("https://sudoku-ro71.onrender.com/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify()
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // console.log(response.json())
        return response.json();
      })
      .then(data => {
        // Assume data.board is the string
        setBoardStr(data[0] || "");
        setLoading(false);
        setSeconds(0);
      })
      .catch(error => {
        setBoardStr("Error loading board.");
        setLoading(false);
        console.error("API error:", error);
      });
  }, []);

  return (
    
    <div className="App">
      <h1>Sudoku!!</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
            <div style={{ fontSize: "1.5em", marginBottom: "10px" }}>
            Timer: {formatTime(seconds)}
            </div>
            <SudokuBoard boardStr={boardStr} resetTimer={resetTimer}/>
        </div>
      )}
    </div>
  );
}

export default App;
