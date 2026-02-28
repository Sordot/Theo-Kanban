import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import './App.css'

function App() {

  //set up initial column state
  const [columns, setColumns] = useState([
    {id: 1, title: 'To Do', tasks: ['Learn React', 'Set up project!']},
    {id: 2, title: 'In Progress', tasks: []},
    {id: 3, title: 'Done', tasks: []}
  ])

  const addTask = (inputColumnID) => {
    //ask user for input
    const content = window.prompt('Task Description:')
    if (!content) return
    //update column with provided input
    const updatedColumns = columns.map(column => {
      if (column.id !== inputColumnID) return column
      return {...column, tasks: [...column.tasks, content]}
    })
    setColumns(updatedColumns)
  }

  const deleteTask = (inputColumnID, taskIndex) => {
    //filter the desired task index from the current array and return an updated array
    setColumns(prevColumns => prevColumns.map(column => {
      if (column.id !== inputColumnID) return column
      return {...column, tasks: column.tasks.filter((_, index) => index !== taskIndex)}
    }))
  }

  return (
    <div className='kanban-container'>
      <h1>Welcome to Theo Kanban!</h1>

      <div className='kanban-board'>
        {/* map through the kanban columns */}
        {columns.map((column) => (
          <div className='kanban-column' key={column.id}>
            <div className="column-header">
              <h3 className='column-title'>{column.title}</h3>
              <button className='add-task-btn' onClick={() => addTask(column.id)}>+</button>
            </div>
            {/*now map each task for for each column*/}
            <div className='task-list'>
              {column.tasks.map((task, index) => (
                <div key={index} className='task-card'>
                  <span>{task}</span>
                  <button className='delete-btn' onClick={() => deleteTask(column.id, index)}>x</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>  
    </div>
    
  )
}

export default App
