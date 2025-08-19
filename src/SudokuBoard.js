/*********************************************************
 *                      SUDOKU BOARD
 * Playable sudoku board with buttons to navigate number
 * input, notes mode, generate new board, and clearing.
 * User wins when all cells are filled correctly. 
 *********************************************************/

import React, { useState, useEffect } from "react";
import "./App.css";

/*****************  DEFAULT FUNCTIONS  *******************/
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

/******************   SUDOKUBOARD LOGIC **************************
 * Input: boardStr: all numbers in board
 *        resetTimer function: reset timer for new boards
 *        onGenerateNewBoard: allows user to click generate button
 *        time: shows time on finish box
 *        onFinish: stops timer when finished
 * 
 * Output: Playable sudoku board with user buttons such as notes mode,
 *         generate new board, and clear
 * 
 * Effects: Can change timer, boardStr (to fill out numbers), 
 * 
 * Limitation: Cannot call api, change difficulty
 * 
 ****************************************************************/

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

  /************************  USE EFFECTS  **************************/

  /* Update board when boardStr changes (for new board) */
  useEffect(() => {
    handleClearBoard();
  }, [boardStr]);

  /* Keyboard navigation */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selected.row === null || selected.col === null) return;
      let { row, col } = selected;
      /* SHIFT */
      if (e.shiftKey) {
        setNotesMode(!notesMode);
        e.preventDefault(); 
      }

      /* ARROWS */
      if (e.key === "ArrowLeft") {
        col = col > 0 ? col - 1 : col;
      } else if (e.key === "ArrowRight") {
        col = col < 8 ? col + 1 : col;
      } else if (e.key === "ArrowUp") {
        row = row > 0 ? row - 1 : row;
      } else if (e.key === "ArrowDown") {
        row = row < 8 ? row + 1 : row;
      } 

      /* DELETE */
      else if (
        (e.key === "Backspace" || 
        e.key === "Delete") && 
        initialBoard[row][col] === 0
       ) {
        handleNumberPadClear();
        e.preventDefault();
        return;
      } 

      /* NUMBER INPUT */
      else if (
        /^[1-9]$/.test(e.key) && 
        initialBoard[row][col] === 0
      ) {
        handleNumberPadInput(e.key);
        e.preventDefault();
        return;
      } 

      /* OTHER */
      else {
        return;
      }

      setSelected({ row, col });
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, board, notes, notesMode, shiftHeld, initialBoard]);

  /************************  FUNCTIONS  **************************/

  /* Handle board reset for clear, generating new, changing diff */
  const handleClearBoard = () => {
    setBoard(parseBoard(boardStr));
    setInitialBoard(parseBoard(boardStr));
    setNumCells(getOrigNum(boardStr));
    setNotes({});
    setIncorrectCells({});
    setSelected({ row: 0, col: 0 });
    if (resetTimer) resetTimer();
  };

  /* Render in cell notes */
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

  /* Check to see if there are any repeats next to current cell */
  const checkCell = (row, col, val) => {
    let first_row = Math.floor(row / 3) * 3;
    let first_col = Math.floor(col / 3) * 3;
    let wrong = false;
    for (let i = 0; i < 9; i++) {
        // Row incorrect
        if (board[i][col] == val) {
            wrong = true;
        }
        // Column incorrect
        else if (board[row][i] == val) {
            wrong = true;
        }
        // Box incorrect
        if (board[first_row + Math.floor(i / 3)][first_col + (i % 3)] == val) {
            wrong = true;
        }
    }
    setIncorrectCells(prev => ({
        ...prev,
        [`${row}-${col}`]: wrong
    }));

    return !wrong; // Return state of correctness
  }

  /* Handler for number pad buttons */
  const handleNumberPadInput = (num) => {
    const { row, col } = selected;
    if (row === null || col === null) return;
    if (initialBoard[row][col] !== 0) return; // Don't allow editing clues
    const newBoard = board.map(arr => arr.slice());

    // Check previously filled val to keep track of completion
    const prefilled = newBoard[row][col] != 0;
    const prevNum = newBoard[row][col];
    const prevCorrect = !incorrectCells[`${row}-${col}`];

    // Notes mode
    if (notesMode) {
        const key = `${row}-${col}`;
        let cellNotes = notes[key] || [];
        if (cellNotes.includes(num)) {
            cellNotes = cellNotes.filter(n => n !== num);
        } else {
            cellNotes = [...cellNotes, num].sort();
        }
        newBoard[row][col] = 0;
        setBoard(newBoard);
        setNotes({ ...notes, [key]: cellNotes });

        // if prev board was correct, increase num remaining
        if (prevCorrect && prevNum != 0) {
            let currCellsRemaining = numCells + 1
            setNumCells(currCellsRemaining);
        }
        
    } 
    // Normal mode
    else {
        const prefilled = newBoard[row][col] != 0;

        // if number isnt same as previously typed
        if (newBoard[row][col] != Number(num)) {

            let correct = checkCell(row, col, num);
            newBoard[row][col] = Number(num); // set new
            setBoard(newBoard);
            
            // Cell is correct and previous was not correct, decrease cells remaining
            if (correct && (prevNum == 0 || prevCorrect == false)) {
                let currCellsRemaining = numCells - 1

                // Check for completion
                if (currCellsRemaining == 0) {
                    if (typeof onFinish === "function") onFinish();
                    setFinished(true);
                }
                setNumCells(currCellsRemaining);
            }
            // Cell is not correct and previous cell was correct 
            else if (!correct && (prevCorrect && prevNum != 0)) { 
                setNumCells(numCells + 1);
            }
        }
    }
  };

  // Handler for cell clear button
  const handleNumberPadClear = () => {
    const { row, col } = selected;
    if (row === null || col === null) return;
    if (initialBoard[row][col] !== 0) return; // Dont delete prefilled
    const notesActive = notesMode || shiftHeld;

    // if empty and there are notes, delete notes
    if (board[row][col] == 0) {
        setNotes({ ...notes, [`${row}-${col}`]: [] });
    }
    // delete number in cell
    else {
        const newBoard = board.map(arr => arr.slice());
        newBoard[row][col] = 0;
        setBoard(newBoard);
        // if it was correct, increment cells remaining
        if (incorrectCells[`${row}-${col}`] === false) {
            let currCellsRemaining = numCells + 1;
            setNumCells(currCellsRemaining);
        }
        setIncorrectCells(prev => ({ ...prev, [`${row}-${col}`]: false }));
    }
  };
  
  /************************  RENDER HTML  **************************/
  return (
    <div>
      {/* FINISHED OVERLAY */}
      {finished && (
        <div className="sudoku-overlay">
            <div className="sudoku-overlay-content">
            <h2>Congrats, you finished!</h2>
            <p>Your time: {typeof time === "number" ? 
                `${String(Math.floor(time / 3600)).padStart(2, "0")}:${String(Math.floor((time % 3600) / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}` 
                : time}</p>
            <button onClick={() => {setFinished(false); setIncorrectCells({}); onGenerateNewBoard();}}>Generate New Board</button>
            </div>
        </div>
        )}

      {/* SUDOKU BOARD */}
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
                    onClick={() => setSelected({row, col})}
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

      {/* OPTION BUTTONS */}
      <div className="optn-btn-container">

        {/* Notes Mode Button */}
        <button
            className={`notes-mode-btn${notesMode ? " active" : ""}`}
            onClick={() => setNotesMode(!notesMode)}
        >
            {notesMode ? "Exit Notes Mode" : "Enter Notes Mode"}
        </button>

        {/* Generate New Board Button */}
        <button
            className="generate-btn"
            onClick={() => {setIncorrectCells({}); onGenerateNewBoard();}}
        >
            Generate New Board
        </button>

        {/* Clear Button */}
        <button
            className="clear-btn"
            onClick={handleClearBoard}
        >
            Clear
        </button>
      </div>

      {/* NUMBER PAD */}
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