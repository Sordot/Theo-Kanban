import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import './App.css'
import { useKanban } from './hooks/useKanban'
import Column from './components/Column'
import ConfirmationModal from './components/ConfirmationModal'
import Sidebar from './components/Sidebar'
import BoardHeader from './components/BoardHeader'

const DEFAULT_DATA = [
  {
    id: 'board-1',
    name: '🚀 Project 1',
    columns: [{id: 1, title: 'To Do', tasks: [{id:'t1', text:'Learn React', priority: 'high', description: 'Shake off the rust!', isNew: false}, {id: 't2', text: 'Set up project', priority: 'low', description: 'AI is OP', isNew: false}]},
    {id: 2, title: 'In Progress', tasks: []},
    {id: 3, title: 'Done', tasks: []}]
  },
  {
    id: 'board-2',
    name: '🛠️ Project 2',
    columns: [{id: 1, title: 'To Do', tasks: [{id:'t1', text:'Learn React', priority: 'high', description: 'Shake off the rust!', isNew: false}, {id: 't2', text: 'Set up project', priority: 'low', description: 'AI is OP', isNew: false}]},
    {id: 2, title: 'In Progress', tasks: []},
    {id: 3, title: 'Done', tasks: []}]
  }  
] 

function App() {

  const { 
    boards, 
    addBoard,
    updateBoard,
    deleteBoard,            
    activeBoardID,      
    setActiveBoardID,
    columns, 
    activeTask, 
    addTask, 
    updateTask,  
    addColumn, 
    modalConfig,
    openDeleteModal,
    openRenameModal,
    modalRenameValue,
    setModalRenameValue,
    closeModal,
    confirmDelete, 
    handleDragOver, 
    handleDragEnd,
    isAddingColumn, 
    newColumnTitle, 
    setNewColumnTitle, 
    openColumnEditor, 
    closeColumnEditor 
  } = useKanban(DEFAULT_DATA)

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 8}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
  )

  return (
    <div className="app-layout">
      <Sidebar 
      boards={boards} 
      activeBoardID={activeBoardID} 
      onSelectBoard={setActiveBoardID}
      onAddBoard={addBoard} 
      onDeleteBoard={openDeleteModal}
      onRenameBoard={openRenameModal}
      />
      <div className='kanban-container'>
        <BoardHeader className="board-header">
          <h2>{boards.find(b => b.id === activeBoardID)?.name || "Kanban Board"}</h2>
        </BoardHeader>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className='kanban-board'>
            {/* map through the kanban columns */}
            {columns && columns.map((column) => (
              <Column 
                key={column.id}
                column={column}
                onAddTask={addTask}
                onDeleteTask={(colId, taskId) => openDeleteModal('task', { columnID: colId, taskID: taskId })}
                onUpdateTask={updateTask}
                onRemoveColumn={() => openDeleteModal('column', { columnID: column.id })}
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
          <DragOverlay>
            {activeTask ? (
              <div className={`task-card dragging-overlay priority-${activeTask.priority}`}>
                <div className='task-content'>
                  <span className='task-text'>{activeTask.text}</span>
                </div>
                
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>  
      </div>
    </div>   
  )
}

export default App
