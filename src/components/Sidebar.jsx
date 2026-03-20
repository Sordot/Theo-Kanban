import logoIcon from '../assets/Kanban-Wizard-removebg-preview.png'

export default function Sidebar({ boards, activeBoardID, onSelectBoard, onAddBoard, onDeleteBoard, onRenameBoard, onExportBoard, theme, toggleTheme }) {

  

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logoIcon} alt="Theo Kanban" className="logo-icon" />
        <span>Kanban Wizard</span>
      </div>
      <nav className="board-list">
        <div className="board-items-container">
          {boards.map(board => (
            <div key={board.id} className={`board-item-wrapper ${board.isNew ? 'is-new' : ''} ${board.isDeleting ? 'is-deleting' : ''}`}>
              <button
                className={`board-link ${board.id === activeBoardID ? 'active' : ''}`}
                onClick={() => onSelectBoard(board.id)}
              >
                {board.name}
              </button>
              <div className="board-actions">
                <button onClick={(e) => { e.stopPropagation(); onRenameBoard(board); }} className="edit-board-name-btn">✏️</button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteBoard('board', { boardID: board.id }); }} className="delete-board-btn">X</button>
              </div>
            </div>
          ))}
        </div>
        <button className="add-board-sidebar" onClick={onAddBoard}>+ New Board</button>
        
      </nav>
      <div className="sidebar-footer">
        <button className="export-btn" onClick={onExportBoard} title="Export current board as JSON">
          <span>💾 Export Board as JSON</span>
        </button>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <>
                <span>☀️ Light Mode</span>
              </>
            ) : (
              <>
                <span>🌑 Dark Mode</span>
              </>
            )}
          </button>
        </div>
    </aside>
  );
}