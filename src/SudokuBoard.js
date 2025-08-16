import React, { useState, useEffect } from "react";
import "./App.css";

function parseBoard(boardStr) {
//   const [numCells, setNumCells] = useState(0);
//   setNumCells(boardStr.split('0').length - 1);
//   console.log(`num cells: ${numCells}`);
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
  const [shiftHeld, setShiftHeld] = useState(false);
  const [numCells, setNumCells] = useState(0);
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
        const notesActive = notesMode || shiftHeld;
        if (notesActive || board[row][col] == 0) {
            setNotes({ ...notes, [`${row}-${col}`]: [] });
        } else {
            const newBoard = board.map(arr => arr.slice());
            newBoard[row][col] = 0;
            setBoard(newBoard);
            setIncorrectCells(prev => ({ ...prev, [`${row}-${col}`]: false }));
        }
        e.preventDefault();
        return;
      } else if (e.key === "Shift") {
        setShiftHeld(true);
        return;
      } else if (
        /^[1-9]$/.test(e.key) && 
        initialBoard[row][col] === 0
      ) {
        const notesActive = notesMode || shiftHeld;
        if (notesActive) {
          // Notes mode: toggle note number in cell
          const key = `${row}-${col}`;
          let cellNotes = notes[key] || [];
          if (cellNotes.includes(e.key)) {
            cellNotes = cellNotes.filter(n => n !== e.key);
          } else {
            cellNotes = [...cellNotes, e.key].sort();
          }
          const newBoard = board.map(arr => arr.slice());
          newBoard[row][col] = 0;
          setBoard(newBoard);
          setNotes({ ...notes, [key]: cellNotes });
        } else {
          // Normal mode: set cell value
        //   console.log("setting bb");
          const newBoard = board.map(arr => arr.slice());
          newBoard[row][col] = Number(e.key);
          setBoard(newBoard);
        //   setNotes({ ...notes, [`${row}-${col}`]: [] });
          checkCell(row, col, e.key);
        }
        e.preventDefault();
        return;
      } else {
        return;
      }
      setSelected({ row, col });
      e.preventDefault();
    };
    const handleKeyUp = (e) => {
      if (e.key === "Shift") {
        setShiftHeld(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selected, board, notes, notesMode, shiftHeld, initialBoard]);

  const handleCellClick = (row, col) => {
    setSelected({ row, col });
  };

  const handleInput = (e, row, col) => {
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
      console.log("handle input");
      if (initialBoard[row][col] !== 0) return;
      const newBoard = board.map(arr => arr.slice());
      newBoard[row][col] = val ? Number(val) : 0;
      setBoard(newBoard);
      // TODO: check for incorrect or correct
      console.log("not setting notes to clear")
      setNotes({ ...notes, [`${row}-${col}`]: [] }); // TODO hide them instead of empty
      checkCell(row,col,val);
    }
  };

  const renderNotes = (row, col) => {
    const key = `${row}-${col}`;
    const cellNotes = notes[key] || [];
    if (cellNotes.length === 0 || board[row][col] != 0) return null;
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
    // console.log(`Checking cell: ${val}`);
    for (let i = 0; i < 9; i++) {
        // console.log(`${val} vs col ${board[i][col]}`)
        if (board[i][col] == val) {
            // console.log("col: WRONG");
            wrong = true;
        }
        else if (board[row][i] == val) {
            // console.log("row: WRONG")
            wrong = true;
        }
        if (board[first_row + Math.floor(i / 3)][first_col + (i % 3)] == val) {
            // console.log("box: WRONG");
            wrong = true;
        }
    }
    setIncorrectCells(prev => ({
        ...prev,
        [`${row}-${col}`]: wrong
    }));
    //     let first_row = Math.floor(row / 3) * 3;
    // let first_col = Math.floor(col / 3) * 3;
    // let wrongCells = {};
    // // Check column
    // for (let i = 0; i < 9; i++) {
    //     if (i !== row && board[i][col] == val && val !== "") {
    //         wrongCells[`${i}-${col}`] = true;
    //     }
    // }
    // // Check row
    // for (let i = 0; i < 9; i++) {
    //     if (i !== col && board[row][i] == val && val !== "") {
    //         wrongCells[`${row}-${i}`] = true;
    //     }
    // }
    // // Check box
    // for (let i = 0; i < 9; i++) {
    //     const r = first_row + Math.floor(i / 3);
    //     const c = first_col + (i % 3);
    //     if ((r !== row || c !== col) && board[r][c] == val && val !== "") {
    //         wrongCells[`${r}-${c}`] = true;
    //     }
    // }
    // // Always mark the current cell if any conflict found
    // if (Object.keys(wrongCells).length > 0 && val !== "") {
    //     wrongCells[`${row}-${col}`] = true;
    // }
    // setIncorrectCells(prev => ({
    //     ...prev,
    //     ...wrongCells,
    //     // Clear incorrect if no conflicts
    //     ...(Object.keys(wrongCells).length === 0 ? { [`${row}-${col}`]: false } : {})
    // }));
  }

  // Generate new board from API
  const handleGenerateNewBoard = () => {
    let diff = "EASY";
    fetch(`https://sudoku-ro71.onrender.com/boards${diff}`, {
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

  // Handler for number pad buttons
  const handleNumberPadInput = (num) => {
    const { row, col } = selected;
    if (row === null || col === null) return;
    if (initialBoard[row][col] !== 0) return; // Don't allow editing clues
    if (notesMode) {
      // Notes mode: toggle note number in cell
      const key = `${row}-${col}`;
      let cellNotes = notes[key] || [];
      if (cellNotes.includes(num)) {
        cellNotes = cellNotes.filter(n => n !== num);
      } else {
        cellNotes = [...cellNotes, num].sort();
      }
      setNotes({ ...notes, [key]: cellNotes });
    } else {
      // Normal mode: set cell value
      const newBoard = board.map(arr => arr.slice());
      newBoard[row][col] = Number(num);
      setBoard(newBoard);
      setNotes({ ...notes, [`${row}-${col}`]: [] });
      checkCell(row, col, num);
    }
  };

  // Handler for clear button
  const handleNumberPadClear = () => {
    const { row, col } = selected;
    if (row === null || col === null) return;
    if (initialBoard[row][col] !== 0) return;
    const newBoard = board.map(arr => arr.slice());
    newBoard[row][col] = 0;
    setBoard(newBoard);
    setNotes({ ...notes, [`${row}-${col}`]: [] });
    setIncorrectCells(prev => ({ ...prev, [`${row}-${col}`]: false }));
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
                const selectedValue = board[selected.row][selected.col];
                const isSameValue =
                  cell !== 0 &&
                  selectedValue !== 0 &&
                  cell === selectedValue &&
                  !(isSelected); // Optionally exclude the selected cell itself

                const cellClass =
                  `sudoku-cell${isSelected ? " selected" : ""}` +
                  (highlight && !isSelected ? " highlight" : "") +
                  (initialBoard[row][col] !== 0 ? " clue-cell" : "") +
                  (isSameValue ? " same-value" : "");

                return (
                  <td
                    key={col}
                    className={cellClass}
                    onClick={() => handleCellClick(row, col)}
                  >
                    {cell !== 0 && (
                      <span
                        className={`cell-value${incorrectCells[`${row}-${col}`] ? " incorrect" : ""}`}
                      >
                        {cell}
                      </span>
                    )}
                    {renderNotes(row, col)}
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

      <div className="number-pad" style={{ marginTop: "20px" }}>
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button
            key={num}
            className="number-pad-btn"
            onClick={() => handleNumberPadInput(num.toString())}
          >
            {num}
          </button>
        ))}
        <button
          className="number-pad-btn"
          onClick={handleNumberPadClear}
        >
          X
        </button>
      </div>
    </div>
  );
};

export default SudokuBoard;