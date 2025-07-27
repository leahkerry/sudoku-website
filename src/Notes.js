import React from "react";

const Notes = ({ value, onChange }) => {
  return (
    <div className="notes-section">
      <h3>Markdown Notes for Selected Cell</h3>
      <textarea
        rows={4}
        cols={30}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter markdown notes here..."
      />
    </div>
  );
};

export default Notes;