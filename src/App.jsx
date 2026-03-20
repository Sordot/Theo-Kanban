import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { FaGithub, FaLinkedin, FaSun, FaMoon } from 'react-icons/fa'
import './App.css'
import { useTheme } from './hooks/useTheme'
import { useKanban } from './hooks/useKanban'
import Column from './components/Column'
import ConfirmationModal from './components/ConfirmationModal'
import Sidebar from './components/Sidebar'
import TaskModal from './components/TaskModal'
import AnalyticsBar from './components/AnalyticsBar'

const DEFAULT_DATA = [
  {
    id: 'board-1',
    name: '🚀 Project 1',
    columns: [{ id: 1, title: 'To Do', tasks: [{ id: 't1', text: 'Example Task', priority: 'High', description: 'Click this field to edit!', isNew: false }, { id: 't2', text: 'Drag Me', priority: 'Low', description: '', isNew: false }] },
    { id: 2, title: 'In Progress', tasks: [] },
    { id: 3, title: 'Done', tasks: [] }]
  },
  {
    id: 'board-2',
    name: '🛠️ Project 2',
    columns: [{ id: 1, title: 'To Do', tasks: [{ id: 't1', text: 'Learn React', priority: 'High', description: 'Shake off the rust!', isNew: false }, { id: 't2', text: 'Drag Me', priority: 'Low', description: '', isNew: false }] },
    { id: 2, title: 'In Progress', tasks: [] },
    { id: 3, title: 'Done', tasks: [] }]
  }
]

function App() {

  const {
    boards,
    addBoard,
    activeBoardID,
    setActiveBoardID,
    columns,
    activeTask,
    addTask,
    insertTask,
    updateTask,
    addColumn,
    updateColumn,
    sortColumn,
    clearColumn,
    modalConfig,
    openDeleteModal,
    openRenameModal,
    modalRenameValue,
    setModalRenameValue,
    closeModal,
    confirmDelete,
    handleDragOver,
    handleDragStart,
    handleDragEnd,
    isAddingColumn,
    newColumnTitle,
    setNewColumnTitle,
    openColumnEditor,
    closeColumnEditor,
    taskModalConfig,
    openTaskModal,
    closeTaskModal
  } = useKanban(DEFAULT_DATA)

  const { theme, toggleTheme } = useTheme();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const issueIcons = {
        "User Story": "📜",
        "Bug": "🌀",
        "Test": "🔮",
        "Spike": "⌛"
    };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  //Custom collision magic to try to prevent snapbacks
  const customCollisionDetection = (args) => {
    // First, verify which droppable containers the mouse pointer is literally over
    const pointerCollisions = pointerWithin(args);
    
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    // If pointer checking fails (e.g. gaps), fallback to geometry
    return closestCorners(args);
  };

  return (
    <div className="app-layout">
      <Sidebar
        boards={boards}
        activeBoardID={activeBoardID}
        onSelectBoard={setActiveBoardID}
        onAddBoard={addBoard}
        onDeleteBoard={openDeleteModal}
        onRenameBoard={openRenameModal}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className='kanban-container'>
        <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div className='kanban-board'>
            {/* map through the kanban columns */}
            {columns && columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                onAddTask={addTask}
                onDeleteTask={(colId, taskId) => openDeleteModal('task', { columnID: colId, taskID: taskId })}
                onUpdateTask={updateTask}
                onSortColumn={sortColumn}
                onUpdateColumn={updateColumn}
                onClearColumn={clearColumn}
                onRemoveColumn={() => openDeleteModal('column', { columnID: column.id })}
                onOpenTaskModal={openTaskModal}
              />
            ))}
            {isAddingColumn ? (
              <div className="add-column-editor">
                <input
                  autoFocus
                  className="edit-input column-title-input"
                  placeholder="Name this column..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addColumn();
                    if (e.key === 'Escape') closeColumnEditor();
                  }}
                />
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={closeColumnEditor}>Cancel</button>
                  <button className="save-btn" onClick={addColumn}>Add Column</button>
                </div>
              </div>
            ) : (
              <button className="add-column-btn" onClick={openColumnEditor}>
                <span>+ Add Column</span>
              </button>
            )}
          </div>
          <ConfirmationModal
            isOpen={modalConfig.isOpen}
            title={modalConfig.type === 'renameBoard' ? "Rename Board" : `Delete ${modalConfig.type}?`}
            confirmText={modalConfig.type === 'renameBoard' ? 'Save Changes' : "Delete"}
            message={
              modalConfig.type === 'renameBoard'
                ? "Enter a new name for your workspace."
                : "This action is permanent and cannot be undone."
            }
            variant={modalConfig.type === 'renameBoard' ? "confirm" : "danger"}
            onConfirm={confirmDelete}
            onCancel={closeModal}
          >
            {modalConfig.type === 'renameBoard' && (
              <input
                className="modal-rename-input"
                value={modalRenameValue}
                onChange={(e) => setModalRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                autoFocus
              />
            )}
          </ConfirmationModal>
          <TaskModal
            isOpen={taskModalConfig.isOpen}
            task={taskModalConfig.task}
            onClose={() => closeTaskModal()}
            onSave={(taskID, updatedTask, isClosing = false) => {
              
              const currentColumn = columns.find(col => col.id === taskModalConfig.columnID);
              const taskAlreadyInserted = currentColumn?.tasks.some(t => t.id === taskID);
              
              // Check if this task was new when the modal opened
              const isOriginallyNew = taskModalConfig.task?.isNew;

              if (isOriginallyNew && !taskAlreadyInserted) {
                // First edit: Insert as a draft (or true if instantly closing)
                insertTask(taskModalConfig.columnID, { 
                    ...updatedTask, 
                    isNew: isClosing ? true : 'draft' 
                });
              } else if (isOriginallyNew && taskAlreadyInserted) {
                // Subsequent inline edits: Force it to stay a 'draft' until closing!
                updateTask(taskModalConfig.columnID, taskID, { 
                    ...updatedTask, 
                    isNew: isClosing ? true : 'draft' 
                });
              } else {
                // Normal edits on existing old tasks
                updateTask(taskModalConfig.columnID, taskID, { 
                    ...updatedTask, 
                    isNew: updatedTask.isNew 
                });
              }
            }}
          />
          <DragOverlay> {/*maintain card data during drag state*/}
            {activeTask ? (
              <div className="tilt-wrapper">
                <div className={`task-card dragging-overlay priority-${activeTask.priority}`}>
                  <div className='task-content'>

                    {/* 1. Added Header (Assignee, Priority, Issue Type) */}
                    <div className='task-header'>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {activeTask.assignee && (
                          <div className="assignee-avatar">
                            {activeTask.assignee.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`priority-badge ${activeTask.priority || 'Medium'}`}>
                          {(activeTask.priority || 'Medium').toUpperCase()}
                        </span>
                        <span>
                          {issueIcons[activeTask.issueType || "User Story"]}
                        </span>
                      </div>
                      <div>
                        {/* Inert buttons to maintain spacing parity with the real card */}
                        <button className='edit-btn' style={{ cursor: 'grabbing' }}>📄</button>
                        <button className='delete-btn' style={{ cursor: 'grabbing' }}>x</button>
                      </div>
                    </div>

                    {/* 2. Task Title */}
                    <p className='task-text'>{activeTask.text || 'Untitled Task'}</p>

                    {/* 3. Added Footer (Subtasks, Updated Time) */}
                    <div className='task-footer' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className='footer-label'>
                        {activeTask.subtasks?.length || 0} {activeTask.subtasks?.length === 1 ? 'Subtask' : 'Subtasks'}
                      </span>
                      <span className='footer-label'>
                        Updated: {formatTime(activeTask.updatedAt)}
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <AnalyticsBar columns={columns} />
        <footer className="portfolio-footer">
          <div className="footer-content">
            <span className="built-by">
              Built by <strong>Theo Gevirtz</strong>
            </span>

            <a href="https://github.com/Sordot/Theo-Kanban" target="_blank" rel="noopener noreferrer" className='footer-link'>
              <FaGithub size={18} />
              <span>GitHub</span>
            </a>

            <a href="https://www.linkedin.com/in/theodore-gevirtz/" target="_blank" rel="noopener noreferrer" className='footer-link'>
              <FaLinkedin size={18} />
              <span>LinkedIn</span>
            </a>
          </div>
        </footer>
      </div>

    </div>
  )
}

export default App
