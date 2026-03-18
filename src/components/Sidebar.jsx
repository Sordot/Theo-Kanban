import logoIcon from '../assets/Kanban-Owl-removebg-preview.png'
import { FaSun, FaMoon } from 'react-icons/fa';

export default function Sidebar({ boards, activeBoardID, onSelectBoard, onAddBoard, onDeleteBoard, onRenameBoard, theme, toggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logoIcon} alt="Theo Kanban" className="logo-icon" />
        <span>Kanban Wizard</span>
      </div>
      <nav className="board-list">
        <div className="board-items-container">
          {boards.map(board => (
            <div key={board.id} className="board-item-wrapper">
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
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <>
                <FaSun size={16} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <FaMoon size={16} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
    </aside>
  );
}