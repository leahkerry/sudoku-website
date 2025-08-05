import React, { useState, useEffect } from "react";
import "./App.css";

function parseBoard(boardStr) {
  const arr = boardStr.replace(/[^0-9]/g, "").split("").map(Number);
  const board = [];
  for (let i = 0; i < 9; i++) {
    board.push(arr.slice(i * 9, (i + 1) * 9));
  }
  return board;
}

function getBoxIndex(row, col) {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

const SudokuBoard = ({ boardStr, resetTimer }) => {
  const [board, setBoard] = useState(parseBoard(boardStr));
  const [initialBoard, setInitialBoard] = useState(parseBoard(boardStr));
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [notes, setNotes] = useState({});
  const [notesMode, setNotesMode] = useState(false);
  const [incorrectCells, setIncorrectCells] = useState({});

  // Update board when boardStr changes (for new board)
  useEffect(() => {
    setBoard(parseBoard(boardStr));
    setInitialBoard(parseBoard(boardStr));
    setNotes({});
    setSelected({ row: 0, col: 0 });
  }, [boardStr]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selected.row === null || selected.col === null) return;
      let { row, col } = selected;
      if (e.key === "ArrowLeft") {
        col = col > 0 ? col - 1 : col;
      } else if (e.key === "ArrowRight") {
        col = col < 8 ? col + 1 : col;
      } else if (e.key === "ArrowUp") {
        row = row > 0 ? row - 1 : row;
      } else if (e.key === "ArrowDown") {
        row = row < 8 ? row + 1 : row;
      } else if (
        (e.key === "Backspace" || 
        e.key === "Delete") && 
        initialBoard[row][col] === 0
       ) {
        const newBoard = board.map(arr => arr.slice());
        newBoard[row][col] = 0;
        setBoard(newBoard);
        setNotes({ ...notes, [`${row}-${col}`]: [] });
        setIncorrectCells(prev => ({ ...prev, [`${row}-${col}`]: false }));
        e.preventDefault();
        return;
      } else {
        return;
      }
      setSelected({ row, col });
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  const handleCellClick = (row, col) => {
    setSelected({ row, col });
  };

  const handleInput = (e, row, col) => {
    console.log(e.target.value);
    const val = e.target.value.replace(/[^1-9]/, "");
    if (notesMode) {
      // Notes mode: toggle note number in cell
      const key = `${row}-${col}`;
      let cellNotes = notes[key] || [];
      if (val) {
        if (cellNotes.includes(val)) {
          cellNotes = cellNotes.filter(n => n !== val);
        } else {
          cellNotes = [...cellNotes, val].sort();
        }
        setNotes({ ...notes, [key]: cellNotes });
      }
    } else {
      // Only allow editing blank cells (not initial clues)
      if (initialBoard[row][col] !== 0) return;
      const newBoard = board.map(arr => arr.slice());
      newBoard[row][col] = val ? Number(val) : 0;
      setBoard(newBoard);
      // TODO: check for incorrect or correct
      setNotes({ ...notes, [`${row}-${col}`]: [] }); // TODO hide them instead of empty
      checkCell(row,col,val);
    }
  };

  const renderNotes = (row, col) => {
    const key = `${row}-${col}`;
    const cellNotes = notes[key] || [];
    if (cellNotes.length === 0) return null;
    return (
      <div className="cell-notes">
        {Array.from({ length: 9 }, (_, i) => {
          const num = (i + 1).toString();
          return (
            <span
              key={num}
              className={`note-number${cellNotes.includes(num) ? " active" : ""}`}
            >
              {cellNotes.includes(num) ? num : ""}
            </span>
          );
        })}
      </div>
    );
  };

  const checkCell = (row, col, val) => {
    let first_row = Math.floor(row / 3) * 3;
    let first_col = Math.floor(col / 3) * 3;
    let wrong = false;
    for (let i = 0; i < 9; i++) {
        // console.log(`${val} vs col ${board[i][col]}`)
        if (board[i][col] === val) {
            console.log("col: WRONG");
            wrong = true;
        }
        else if (board[row][i] === val) {
            console.log("row: WRONG")
            wrong = true
        }
        if (board[first_row + Math.floor(i / 3)][first_col + (i % 3)] === val) {
            console.log("box: WRONG");
            wrong = true;
        }
    }
    setIncorrectCells(prev => ({
        ...prev,
        [`${row}-${col}`]: wrong
    }));
  }

  // Generate new board from API
  const handleGenerateNewBoard = () => {
    fetch("https://sudoku-ro71.onrender.com/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify()
    })
      .then(response => response.json())
      .then(data => {
        // Assume data[0] is the board string
        setBoard(parseBoard(data[0] || ""));
        setInitialBoard(parseBoard(data[0] || ""));
        setNotes({});
        setSelected({ row: 0, col: 0 });
      })
      .catch(error => {
        alert("Error generating new board.");
        console.error("API error:", error);
      });
  };

  const handleClearBoard = () => {
    setBoard(parseBoard(boardStr));
    setInitialBoard(parseBoard(boardStr));
    setNotes({});
    if (resetTimer) resetTimer();
  };

  return (
    <div>
      <table className="sudoku-table">
        <tbody>
          {board.map((rowArr, row) => (
            <tr key={row}>
              {rowArr.map((cell, col) => {
                const isSelected = selected.row === row && selected.col === col;
                const highlight =
                  selected.row === row ||
                  selected.col === col ||
                  (selected.row !== null &&
                    selected.col !== null &&
                    getBoxIndex(selected.row, selected.col) === getBoxIndex(row, col));
                // Gray for initial clues, white for blanks
                const cellClass =
                  `sudoku-cell${isSelected ? " selected" : ""}${highlight && !isSelected ? " highlight" : ""}` +
                  (initialBoard[row][col] !== 0 ? " clue-cell" : "");
                return (
                  <td
                    key={col}
                    className={cellClass}
                    onClick={() => handleCellClick(row, col)}
                  >
                    {/* Always show the main number if present */}
                    {cell !== 0 && (
                      <span
                            className={`cell-value${incorrectCells[`${row}-${col}`] ? " incorrect" : ""}`}
                        >
                            {cell}
                        </span>
                    //   <span className="cell-value">{cell}</span>
                    )}
                    {/* Show notes overlay if notes exist */}
                    {renderNotes(row, col)}
                    {/* Input for editing (hidden visually, but used for input) */}
                    <input
                      type="text"
                      maxLength="1"
                      value=""
                      onChange={e => handleInput(e, row, col)}
                      className="cell-input"
                      style={{ opacity: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      readOnly={false}
                      tabIndex={-1}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className={`notes-mode-btn${notesMode ? " active" : ""}`}
        onClick={() => setNotesMode(!notesMode)}
      >
        {notesMode ? "Exit Notes Mode" : "Enter Notes Mode"}
      </button>
      <button
        className="generate-btn"
        onClick={handleGenerateNewBoard}
      >
        Generate New Board
      </button>
      <button
        className="clear-btn"
        onClick={handleClearBoard}
      >
        Clear
      </button>
    </div>
  );
};

export default SudokuBoard;