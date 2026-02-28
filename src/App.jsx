import {
  DndContext,
  closestCorners,
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

const DEFAULT_DATA = [
    {id: 1, title: 'To Do', tasks: [{id:'t1', text:'Learn React'}, {id: 't2', text: "Set up project"}]},
    {id: 2, title: 'In Progress', tasks: []},
    {id: 3, title: 'Done', tasks: []}
  ]

function App() {

  const { 
    columns, addTask, deleteTask, addColumn, removeColumn, handleDragOver, handleDragEnd 
  } = useKanban(DEFAULT_DATA)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
  )

  return (
    <div className='kanban-container'>
      <h1>Welcome to Theo Kanban!</h1>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className='kanban-board'>
          {/* map through the kanban columns */}
          {columns && columns.map((column) => (
            <Column 
              key={column.id}
              column={column}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onRemoveColumn={removeColumn}
            />
          ))}
          <button className="add-column-btn" onClick={addColumn}> + Add Column</button>
        </div>
        </DndContext>  
    </div>   
  )
}

export default App
