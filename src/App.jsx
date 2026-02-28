import { useState } from 'react'
import {
  DndContext,
  closestCorners,
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
import SortableTask from './components/SortableTask'
import DroppableContainer from './components/DroppableContainer'

function App() {

  //set up initial column state
  const [columns, setColumns] = useState([
    {id: 1, title: 'To Do', tasks: [{id:'t1', text:'Learn React'}, {id: 't2', text: "Set up project"}]},
    {id: 2, title: 'In Progress', tasks: []},
    {id: 3, title: 'Done', tasks: []}
  ])

  const addTask = (inputColumnID) => {
    //ask user for input
    const content = window.prompt('Task Description:')
    if (!content) return

    //get unique task id
    const newTask = {
      // eslint-disable-next-line react-hooks/purity
      id: `task-${Date.now()}`,
      text: content
    }
    setColumns(columns.map(column => {
      if (column.id !== inputColumnID) return column
      return {...column, tasks: [...column.tasks, newTask]}
    }))
  }

  const deleteTask = (inputColumnID, taskID) => {
    //filter the desired task index from the current array and return an updated array
    setColumns(prevColumns => prevColumns.map(column => {
      if (column.id !== inputColumnID) return column
      return {...column, tasks: column.tasks.filter(task => task.id !== taskID)}
    }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
  )

  const handleDragEnd = (event) => {
    const {active, over} = event
    if (!over) return

    const activeID = active.id
    const overID = over.id

    setColumns((prev) => {
      //find the column where task is coming from
      const activeColumn = prev.find(column => column.tasks.some(task => task.id === activeID))
      //find the column where task is being placed
      const overColumn = prev.find((column => column.id === overID || column.tasks.some((task) => task.id === overID)))

      if (!activeColumn || !overColumn) return prev
      
      //CASE: A - if item is dropped in the same column
      if (activeColumn.id === overColumn.id) {
        const oldIndex = activeColumn.tasks.findIndex(task => task.id === activeID)
        const newIndex = activeColumn.tasks.findIndex(task => task.id === overID)

        return prev.map(column => {
          if (column.id === activeColumn.id) {
            return {...column, tasks: arrayMove(column.tasks, oldIndex, newIndex)}
          }
          return column
        })
      }

      //CASE B: - moving item to a different column
      const activeTask = activeColumn.tasks.find((task) => task.id === activeID)

      return prev.map((column) => {
        //remove from source column array
        if (column.id === activeColumn.id) {
          return {
            ...column, tasks: column.tasks.filter((task) => task.id !== activeID)
          }
        }
        //add to destination column array
        if (column.id === overColumn.id) {
          return {
            ...column, tasks: [...column.tasks, activeTask]
          }
        }
        return column
      })
    }) 
  }

  const handleDragOver = (event) => {
    const {active, over} = event
    if (!over) return

    const activeID = active.id
    const overID = over.id

    setColumns((prev) => {
      const activeColumn = prev.find(column => column.tasks.some(task => task.id === activeID))
      const overColumn = prev.find(column => column.id === overID || column.tasks.some((task) => task.id === overID))

      if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
        return prev
      }

      const activeTask = activeColumn.tasks.find((task) => task.id === activeID)
      const overTasks = overColumn.tasks

      // Calculate the new index in the destination column
      const overIndex = overTasks.findIndex(t => t.id === overID)
      let newIndex = overIndex >= 0 ? overIndex : overTasks.length

      return prev.map(column => {
        if (column.id === activeColumn.id) {
          return {...column, tasks: column.tasks.filter((task) => task.id !== activeID)}
        }
        if (column.id === overColumn.id) {
          const newTasks = [...column.tasks]
          newTasks.splice(newIndex, 0, activeTask) //Insert selected task at new index
          return {...column, tasks: newTasks}
        }
        return column
      })
    })
  }

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
                <button className='add-task-btn' onClick={() => addTask(column.id)}>+</button>
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
        </div>
        </DndContext>  
    </div>   
  )
}

export default App
