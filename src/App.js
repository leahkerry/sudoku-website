import React, { useEffect, useState } from "react";
import SudokuBoard from "./SudokuBoard";
import "./App.css";

function App() {
  const [boardStr, setBoardStr] = useState("");
  const [loading, setLoading] = useState(true);

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
        <SudokuBoard boardStr={boardStr} />
      )}
    </div>
  );
}

export default App;
