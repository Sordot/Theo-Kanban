import { useState, useRef, useEffect } from 'react';
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DroppableContainer from './DroppableContainer'
import SortableTask from "./SortableTask"

export default function Column({ column, onAddTask, onDeleteTask, onUpdateTask, onUpdateColumn, onClearColumn, onSortColumn, onRemoveColumn, onOpenTaskModal }) {

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(column.title);

    // 1. state to manage the dropdown's visibility
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Check for newly created columns and clear their isNew state 1000ms after creation to match animation timer
    useEffect(() => {
        if (column.isNew) {
            const timer = setTimeout(() => {
                onUpdateColumn(column.id, { isNew: false });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [column.isNew, column.id, onUpdateColumn]);

    // 2. Add an effect to handle clicking outside the menu to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleTitleSave = () => {
        const finalTitle = titleInput.trim() ? titleInput : "Untitled Column";
        setTitleInput(finalTitle); // Reset to fallback if they left it blank
        setIsEditingTitle(false);
        if (onUpdateColumn) {
            onUpdateColumn(column.id, { title: finalTitle });
        }
    };

    return (
        <div className={`kanban-column ${column.isDeleting ? 'is-deleting' : ''} ${column.isNew ? 'is-new' : ''}`}
            key={column.id}
            style={{ overflow: column.isNew ? 'hidden' : undefined }}
        >
            <div className="column-header">
                <div className="column-title-container">
                    {isEditingTitle ? (
                        <input
                            className="editable-field" // Added editable-field
                            autoFocus
                            maxLength={40}
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            style={{
                                display: 'block',
                                width: '100%',
                                boxSixing: 'border-box',
                                fontSize: '1.2em',
                                fontWeight: 'bold',
                                background: 'transparent',
                                color: 'inherit',
                                outline: 'none',
                                appearance: 'none',       /* Strips native browser focus shifts */
                                WebkitAppearance: 'none', /* For Safari */
                                lineHeight: '1.2'         /* Locks text baseline */
                            }}
                        />
                    ) : (
                        <div
                            className="column-title editable-field" /* Changed from editable */
                            onClick={() => setIsEditingTitle(true)}
                            title="Click to edit title"
                            style={{
                                display: 'block',
                                width: '100%',
                                boxSixing: 'border-box',
                                fontSize: '1.2em',
                                fontWeight: 'bold',
                                lineHeight: '1.2',        /* Matches input baseline exactly */
                                whiteSpace: 'nowrap',     /* Matches input's single-line behavior */
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {column.title}
                        </div>
                    )}
                </div>

                <div className="column-controls">
                    <button className="add-task-btn" onClick={() => onAddTask(column.id)}><span>+</span></button>

                    <div className="column-menu-container" ref={menuRef}>
                        <button className="column-menu-btn" onClick={toggleMenu}>
                            ⋮
                        </button>

                        {isMenuOpen && (
                            <div className="column-dropdown-menu">
                                {/* --- Sorting SUB-MENU TRIGGER --- */}
                                <div className="submenu-trigger">
                                    <button className="submenu-btn">
                                        ↕️ Sort tasks...
                                    </button>

                                    {/* --- Sorting SUB-MENU CONTENT --- */}
                                    <div className="submenu-content">
                                        <button onClick={() => { onSortColumn(column.id, 'newest'); setIsMenuOpen(false); }}>
                                            ✨ Newest
                                        </button>
                                        <button onClick={() => { onSortColumn(column.id, 'oldest'); setIsMenuOpen(false); }}>
                                            🕰️ Oldest
                                        </button>
                                        <button onClick={() => { onSortColumn(column.id, 'alpha'); setIsMenuOpen(false); }}>
                                            📖 A-Z
                                        </button>
                                        <button onClick={() => { onSortColumn(column.id, 'effort'); setIsMenuOpen(false); }}>
                                            ⚡ Effort
                                        </button>
                                        <button onClick={() => { onSortColumn(column.id, 'priority-desc'); setIsMenuOpen(false); }}>
                                            🔥 Highest Priority
                                        </button>
                                        <button onClick={() => { onSortColumn(column.id, 'priority-asc'); setIsMenuOpen(false); }}>
                                            🕯️ Lowest Priority
                                        </button>
                                    </div>
                                </div>
                                {/* ------------------------ */}
                                <button className="clear-column-option" onClick={() => { onClearColumn(column.id); setIsMenuOpen(false); }}>
                                    🔄 Clear tasks
                                </button>
                                <button className="delete-column-option" onClick={() => { onRemoveColumn(column.id); setIsMenuOpen(false); }}>
                                    ❌ Delete column
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            <SortableContext id={column.id} items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <DroppableContainer id={column.id} className="task-list">
                    {column.tasks.length === 0 && (
                        <div className="empty-column-placeholder">
                            <h4>No tasks here yet.</h4>
                        </div>
                    )}
                    {column.tasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            id={task.id}
                            task={task}
                            columnID={column.id}
                            onDelete={onDeleteTask}
                            onUpdate={onUpdateTask}
                            onOpenModal={onOpenTaskModal}
                        />
                    ))}
                </DroppableContainer>
            </SortableContext>
            <div className="column-footer">
                <span className="task-count">
                    {column.tasks.length} {column.tasks.length === 1 ? 'Task' : 'Tasks'}
                </span>
            </div>
        </div>
    );
}