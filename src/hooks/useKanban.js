import { useState, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";

export const useKanban = (initialData) => {

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('theo-kanban-data')
        return saved ? JSON.parse(saved) : initialData
    })

    useEffect(() => {
        localStorage.setItem('theo-kanban-data', JSON.stringify(columns))
    }, [columns])

    //CRUD UTILITIES
    const addTask = (inputColumnID) => {
        //ask user for input
        const content = window.prompt('Task Description:')
        if (!content) return
    
        //get unique task id
        const newTask = {
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

    const addColumn = () => {
        const title = window.prompt('Column Title:')
        if (!title) return
    
        const newColumn = {
          id: `col-${Date.now()}`,
          title: title,
          tasks: []
        }
    
        setColumns([...columns, newColumn])
    }

    const removeColumn = (columnID) => {
        if (window.confirm("Are you sure you'd like to remove this column and all of its child tasks?")) {
          setColumns(columns.filter(column => column.id !== columnID))
        }
    }

    //Drag and Drop Handlers
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
  return { columns, addTask, deleteTask, addColumn, removeColumn, handleDragOver, handleDragEnd}
}