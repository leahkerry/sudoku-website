import React, { useState, useEffect } from "react";
import "./App.css";

function getOrigNum(boardStr) {
    return boardStr.split('0').length - 1;
}

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

const SudokuBoard = ({ boardStr, resetTimer, onGenerateNewBoard, time, onFinish}) => {
  const [board, setBoard] = useState(parseBoard(boardStr));
  const [initialBoard, setInitialBoard] = useState(parseBoard(boardStr));
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [notes, setNotes] = useState({});
  const [notesMode, setNotesMode] = useState(false);
  const [incorrectCells, setIncorrectCells] = useState({});
  const [shiftHeld, setShiftHeld] = useState(false);
  const [numCells, setNumCells] = useState(getOrigNum(boardStr));
  const [finished, setFinished] = useState(false);
  // Update board when boardStr changes (for new board)
  useEffect(() => {
    setBoard(parseBoard(boardStr));
    setInitialBoard(parseBoard(boardStr));
    setNotes({});
    setSelected({ row: 0, col: 0 });
    setNumCells(getOrigNum(boardStr));
  }, [boardStr]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selected.row === null || selected.col === null) return;
      let { row, col } = selected;
      const notesActive = notesMode || e.shiftKey;
    //   setNotesMode(notesMode || e.shiftKey);
    //   if (e.key === "Shift") {
    //     // console.log("shifting");
    //     setShiftHeld(true);
    //     notesActive = true;
    //   }
      if (e.shiftKey) {
        console.log("shifting")
        setNotesMode(!notesMode);
        e.preventDefault(); // Prevent default behavior for Shift
      }
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
        handleNumberPadClear();
        e.preventDefault();
        return;
      } else if (
        /^[1-9]$/.test(e.key) && 
        initialBoard[row][col] === 0
      ) {
        handleNumberPadInput(e.key, notesActive);
        e.preventDefault();
        return;
      } else {
        return;
      }
      setSelected({ row, col });
      e.preventDefault();
    };
    // const handleKeyUp = (e) => {
    //   if (e.key === "Shift") {
    //     setNotesMode(false);
    //     // console.log("not shifting");
    //   }
    // };
    window.addEventListener("keydown", handleKeyDown);
    // window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    //   window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selected, board, notes, notesMode, shiftHeld, initialBoard]);

  const handleCellClick = (row, col) => {
    setSelected({ row, col });
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
    if (wrong) {
        return false;
    } else {
        return true;
    }
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


  const handleClearBoard = () => {
    setBoard(parseBoard(boardStr));
    setInitialBoard(parseBoard(boardStr));
    setNumCells(getOrigNum(boardStr));
    setNotes({});
    setIncorrectCells({});
    if (resetTimer) resetTimer();
  };

  // Handler for number pad buttons
  const handleNumberPadInput = (num, notesActive) => {
    const { row, col } = selected;
    console.log(`${num} shift held: ${shiftHeld}`);
    // const notesActive = notesMode || shiftHeld;
    if (row === null || col === null) return;
    if (initialBoard[row][col] !== 0) return; // Don't allow editing clues

    if (notesActive) {
        // Notes mode: toggle note number in cell
        const key = `${row}-${col}`;
        let cellNotes = notes[key] || [];
        if (cellNotes.includes(num)) {
        cellNotes = cellNotes.filter(n => n !== num);
        } else {
        cellNotes = [...cellNotes, num].sort();
        }
        const newBoard = board.map(arr => arr.slice());
        newBoard[row][col] = 0;
        setBoard(newBoard);
        setNotes({ ...notes, [key]: cellNotes });
    } else {
        // Normal mode: set cell value
        const newBoard = board.map(arr => arr.slice());
        const prefilled = newBoard[row][col] != 0;
        if (newBoard[row][col] != Number(num)) {
        newBoard[row][col] = Number(num);
        setBoard(newBoard);
        const correct = checkCell(row, col, num);
        //   setNotes({ ...notes, [`${row}-${col}`]: [] });

        // if cell is checked and original cell val not 0
        if (!prefilled && correct) {
            let currCellsRemaining = numCells - 1
            console.log(`nnum cells left now: ${currCellsRemaining}`)

            if (currCellsRemaining == 0) {
                console.log("filled");
                if (typeof onFinish === "function") onFinish();
                setFinished(true);
            }
            setNumCells(currCellsRemaining);
        }
        
        
        }
    }
  };

  // Handler for clear button
  const handleNumberPadClear = () => {
    const { row, col } = selected;
    if (row === null || col === null) return;
    if (initialBoard[row][col] !== 0) return;
    const notesActive = notesMode || shiftHeld;
    // if empty and there are notes, delete notes
    if (board[row][col] == 0) {
        setNotes({ ...notes, [`${row}-${col}`]: [] });
    } else {
        const newBoard = board.map(arr => arr.slice());
        newBoard[row][col] = 0;
        setBoard(newBoard);
        if (incorrectCells[`${row}-${col}`] === false) {
            let currCellsRemaining = numCells + 1;
            console.log(`nnum cells left now: ${currCellsRemaining}`);
            setNumCells(currCellsRemaining);
        }
        

        setIncorrectCells(prev => ({ ...prev, [`${row}-${col}`]: false }));
    }
    // const { row, col } = selected;
    // if (row === null || col === null) return;
    // if (initialBoard[row][col] !== 0) return;
    // const newBoard = board.map(arr => arr.slice());
    // newBoard[row][col] = 0;
    // setBoard(newBoard);
    // setNotes({ ...notes, [`${row}-${col}`]: [] });
    // setIncorrectCells(prev => ({ ...prev, [`${row}-${col}`]: false }));
  };

  return (
    <div>
      {finished && (
        <div className="sudoku-overlay">
            <div className="sudoku-overlay-content">
            <h2>Congrats, you finished!</h2>
            <p>Your time: {typeof time === "number" ? 
                `${String(Math.floor(time / 3600)).padStart(2, "0")}:${String(Math.floor((time % 3600) / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}` 
                : time}</p>
            <button onClick={() => onGenerateNewBoard()}>Generate New Board</button>
            </div>
        </div>
        )}
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
        onClick={() => onGenerateNewBoard()}
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