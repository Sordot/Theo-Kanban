import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import './App.css'
import { useKanban } from './hooks/useKanban'
import SortableTask from './components/SortableTask'
import DroppableContainer from './components/DroppableContainer'

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
            <div className='kanban-column' key={column.id}>
              <div className="column-header">
                <h3 className='column-title'>{column.title}</h3>
                <div className="column-controls">
                  <button className='add-task-btn' onClick={() => addTask(column.id)}>+</button>
                  <button className="delete-column-btn" onClick={() => removeColumn(column.id)}>x</button>
                </div>
              </div>
              {/*now map each task for for each column*/}
              <SortableContext id={column.id} items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <DroppableContainer id={column.id} className='task-list'>
                  {column.tasks.map((task) => (
                    <SortableTask 
                      key={task.id}
                      id={task.id}
                      task={task}
                      columnID={column.id}
                      onDelete={deleteTask}
                    />
                  ))}
                </DroppableContainer>
              </SortableContext>
            </div>
          ))}
          <button className="add-column-btn" onClick={addColumn}> + Add Column</button>
        </div>
        </DndContext>  
    </div>   
  )
}

export default App
