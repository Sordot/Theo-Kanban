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

const DEFAULT_DATA = [
    {id: 1, title: 'To Do', tasks: [{id:'t1', text:'Learn React', priority: 'high', description: 'Shake off the rust!', isNew: false}, 
                                    {id: 't2', text: 'Set up project', priority: 'low', description: 'AI is OP', isNew: false}]},
    {id: 2, title: 'In Progress', tasks: []},
    {id: 3, title: 'Done', tasks: []}
  ]

function App() {

  const { 
    columns, 
    activeTask, 
    addTask, 
    updateTask,  
    addColumn, 
    modalConfig,
    openDeleteModal,
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
    <div className='kanban-container'>
      <h1>Welcome to Theo Kanban!</h1>
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
        title={`Delete ${modalConfig.type === 'column' ? 'Column' : 'Task'}?`}
        message="This action is permanent and cannot be undone."
        onConfirm={confirmDelete}
        onCancel={closeModal}
        />
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
  )
}

export default App
