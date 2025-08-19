/*********************************************************
 *                      SUDOKU APP
 * Renders complete user interactive sudoku game. 
 * Includes difficulty change, number input, notes mode, 
 * generate new board, board clear, winning state
 * Calls from API or puzzle bucket if API is in waiting
 *********************************************************/

import React, { useEffect, useState, useRef } from "react";
import SudokuBoard from "./SudokuBoard";
import "./App.css";
import puzzlesJson from "./startup_puzzles/puzzles.json"

/*****************  DEFAULT FUNCTIONS  *******************/
function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const DIFFICULTIES = ["easy", "med", "hard"];

/***********************  APP  *************************/
function App() {
  const [boardStr, setBoardStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [difficulty, setDifficulty] = useState("easy");
  const [boards, setBoards] = useState(() => {
    const shuffledPuzzles = {};
    for (const diff of DIFFICULTIES) {
        // Shuffle the array using Fisher-Yates algorithm
        const array = [...puzzlesJson[diff]]; // Create a copy to avoid modifying the original
        for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
        }
        shuffledPuzzles[diff] = array.slice(0, 10); // Take the first 10 elements
    }
    return shuffledPuzzles;
    });
  const timerRef = useRef();

  /************************  USE EFFECTS  **************************/
  // Timer logic
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds(sec => sec + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // get first one in pregenerated when open 
  useEffect(() => {
    setLoading(true);
    setBoardStr(boards['easy'][0] || "");
    if (boards.easy.length > 0) {
        setBoards((prev) => ({
            ...prev,
            easy: prev['easy'].slice(1),
            }));
      }
    setLoading(false);
    resetTimer();
    setSeconds(0);
    // startTimer();
  }, []);

  // Background board generation
  useEffect(() => {
    const generateMoreBoards = async () => {
      
      for (const diff of DIFFICULTIES) {
        if (boards[diff].length < 5) {
            console.log(`Generating more ${diff} boards in the background`);
            const newBoards = await fetchBoards(diff, 1); // Fetch enough to have 3
            console.log(`new boards: ${newBoards}`)
            setBoards((prev) => ({
            ...prev,
            [diff]: [...prev[diff], ...newBoards],
            }));
            console.log(`now boards: ${boards[diff]}`);
        } else {
            console.log(`enough ${diff} boards, no new ones`)
        }
      }
    };

    generateMoreBoards(); // Call it immediately

    // Set interval to check and generate every 30 seconds (adjust as needed)
    const intervalId = setInterval(generateMoreBoards, 30000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [boards]); // Depend on the boards state

    // Fetch boards on mount
    //   useEffect(() => {
    //     // setLoading(true);
    //     // Helper to fetch boards
    //     const fetchBoards = async (diff, count) => {
    //       const boardsArr = [];
    //       for (let i = 0; i < count; i++) {
    //         const res = await fetch(`https://sudoku-ro71.onrender.com/boards/${diff}`, {
    //           method: "POST",
    //           headers: { "Content-Type": "application/json" },
    //           body: JSON.stringify()
    //         });
    //         const data = await res.json();
    //         boardsArr.push(data[0]);
    //         console.log("new board created")
    //       }
    //       return boardsArr;
    //     };
    //     // const fetchBoards = async (diff, count) => {
    //     //     return puzzlesJson[diff];
    //     // }

    //     (async () => {
    //       // Generate 2 easy, 2 med, 2 hard boards in background
    //       const [easyBoards, medBoards] = await Promise.all([
    //         fetchBoards("easy", 2),
    //         fetchBoards("med", 2)
    //       ]);
    //     //   setBoards({ easy: easyBoards, med: medBoards});
    //     //   setBoardStr(()easyBoards[0] || "");
    //       if (boards.easy.length > 1) {
    //         console.log(`easy: ${boards['easy']} ${typeof boards.easy}`)
    //         // setBoards((prev) => ({
    //         //     ...prev,
    //         //     ['easy']: prev['easy'].slice(1),
    //         //     }));
    //       }
    //       setLoading(false);
    //       setSeconds(0);
    //     })();
    //   }, []);

  /************************  FUNCTIONS  **************************/
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

  // Handle difficulty change, fetch new board if needed
  const handleDifficultyChange = async (diff) => {
    setDifficulty(diff);
    // resetTimer();
    // // Use a pre-generated board if available, else fetch a new one
    // if (boards[diff] && boards[diff].length > 0) {
    //   setBoardStr(boards[diff][0]);
    //   setBoards(prev => ({
    //     ...prev,
    //     [diff]: prev[diff].slice(1) // Remove used board
    //   }));
    // } else {
    //   setLoading(true);
    //   const newBoard = await fetchBoards(diff, 1); // Fetch enough to have 3
    //   setBoardStr(newBoard[0] || "");
    //   setLoading(false);
    // }
    generateNewBoard(diff);
  };

  // Serve up new board and call API if none in array
  const generateNewBoard = async (diff = difficulty) => {
    setLoading(true);
    console.log(`generating... ${boards[diff]}`)
    stopTimer();
    if (boards[diff].length == 0) {
        console.log("generating NEW, none in pool")
        try {
            const newBoards = await fetchBoards(diff, 1);
            if (newBoards && newBoards.length > 0) {
                setBoardStr(newBoards[0]); // Set the new board
            } else {
                console.log("No new board fetched from API");
                setBoardStr(""); // Handle the case where no board is returned
            }
        } catch (error) {
            console.error("Error generating new board:", error);
        }
    }
    else 
    {
        console.log("getting from pool");
        const next = boards[diff][0];
        setBoardStr(next);

        // remove from pool
        setBoards(prev => ({
            ...prev,
            [diff]: prev[diff].slice(1) 
        }));
        
        
    }
    
    setLoading(false);
    resetTimer();
    startTimer();
  };
  
  // Fetch specified number of boards from API 
  const fetchBoards = async (diff, count) => {
    const boardsArr = [];
    for (let i = 0; i < count; i++) {
      try {
        console.log(`fetching first board ${diff}`)
        const res = await fetch(
          `https://sudoku-ro71.onrender.com/boards/${diff}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(),
          }
        );
        const data = await res.json();
        boardsArr.push(data[data.length - 1]); // push last in array
        console.log(`new ${diff} board created`);
      } catch (error) {
        console.error(`Error fetching ${diff} board:`, error);
      }
    }
    return boardsArr;
  };
  
  /***********************  RENDER HTML  *************************/
  return (
    <div className="App">
      {/* Title */}
      <h1>Sudoku!</h1>
      
      {loading ? (<p>Loading...</p>) 
               : (
        <>
            <div className="timer-diff-area">

                {/* Difficulty buttons */}
                <div className="diff-btn-area">
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

                {/* Timer */}
                <div style={{ fontSize: "1.5em", marginBottom: "10px" }}>
                Timer: {formatTime(seconds)}
                </div>
            </div>

            {/* Sudoku Board and other buttons */}
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
