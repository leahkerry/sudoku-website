import React, { useEffect, useState, useRef } from "react";
import SudokuBoard from "./SudokuBoard";
import "./App.css";

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// const DIFFICULTIES = ["easy", "med", "hard"]; 
const DIFFICULTIES = ["easy", "med"]; // TODO: fix

function App() {
  const [boardStr, setBoardStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [difficulty, setDifficulty] = useState("easy");
  const [boards, setBoards] = useState({ easy: [], med: [], hard: [] });
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
  const stopTimer = () => {
    clearInterval(timerRef.current);
  };
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setSeconds(sec => sec + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }

  // Fetch boards on mount
  useEffect(() => {
    setLoading(true);
    // Helper to fetch boards
    const fetchBoards = async (diff, count) => {
      const boardsArr = [];
      for (let i = 0; i < count; i++) {
        const res = await fetch(`https://sudoku-ro71.onrender.com/boards/${diff}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify()
        });
        const data = await res.json();
        boardsArr.push(data[0]);
      }
      return boardsArr;
    };

    (async () => {
      // Generate 2 easy, 2 med, 2 hard boards in background
    //   const [easyBoards, medBoards, hardBoards] = await Promise.all([
    //     fetchBoards("easy", 2),
    //     fetchBoards("med", 2),
    //     fetchBoards("hard", 2)
    //   ]);
      const [easyBoards, medBoards] = await Promise.all([
        fetchBoards("easy", 2),
        fetchBoards("med", 2)
      ]);
      setBoards({ easy: easyBoards, med: medBoards});
      setBoardStr(easyBoards[0] || "");
      setLoading(false);
      setSeconds(0);
    })();
  }, []);

  // Handle difficulty change
  const handleDifficultyChange = async (diff) => {
    setDifficulty(diff);
    resetTimer();
    // Use a pre-generated board if available, else fetch a new one
    if (boards[diff] && boards[diff].length > 0) {
      setBoardStr(boards[diff][0]);
      setBoards(prev => ({
        ...prev,
        [diff]: prev[diff].slice(1) // Remove used board
      }));
    } else {
      setLoading(true);
      const res = await fetch(`https://sudoku-ro71.onrender.com/boards/${diff}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify()
      });
      const data = await res.json();
      setBoardStr(data[0] || "");
      setLoading(false);
    }
  };

  const generateNewBoard = async (diff = difficulty) => {
    setLoading(true);
    const res = await fetch(`https://sudoku-ro71.onrender.com/boards/${diff}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify()
    });
    console.log(`diff: ${diff}`)
    const data = await res.json();
    setBoardStr(data[data.length - 1] || "");
    setLoading(false);
    resetTimer();
    startTimer();
  };
  return (
    <div className="App">
      <h1>Sudoku!!</h1>
      
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
            <div className="timer-diff-area">
                <div style={{ marginBottom: "16px" }}>
                    {DIFFICULTIES.map(diff => (
                    <button
                        key={diff}
                        className={`difficulty-btn${difficulty === diff ? " active" : ""}`}
                        onClick={() => handleDifficultyChange(diff)}
                        style={{ marginRight: "8px" }}
                    >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                    ))}
                </div>
                <div style={{ fontSize: "1.5em", marginBottom: "10px" }}>
                Timer: {formatTime(seconds)}
                </div>
            </div>
            <SudokuBoard 
             boardStr={boardStr} 
             resetTimer={resetTimer} 
             onGenerateNewBoard={generateNewBoard}
             time={seconds}
             onFinish={stopTimer}
             />
        </>
      )}
    </div>
  );
}

export default App;
