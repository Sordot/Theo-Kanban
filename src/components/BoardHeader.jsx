import { useState } from 'react';

export default function BoardHeader({ activeBoard, onUpdateBoard }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(activeBoard?.name || "");

  // Keeps the input in sync if the user switches boards while editing

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== activeBoard.name) {
      onUpdateBoard(activeBoard.id, { name: trimmed });
    } else {
      setTitle(activeBoard.name); // Revert if empty
    }
  };

  return (
    <header className="board-header">
      {isEditing ? (
        <input 
          className="board-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      ) : (
        <h2 onClick={() => setIsEditing(true)} className="editable-title">
          {activeBoard?.name}
        </h2>
      )}
    </header>
  );
}