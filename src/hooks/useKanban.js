import { useState, useEffect, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";

export const useKanban = (initialData) => {

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('theo-kanban-data')
        return saved ? JSON.parse(saved) : initialData
    })

    const [activeTask, setActiveTask] = useState(null)

    const [isAddingColumn, setIsAddingColumn] = useState(false)
    const [newColumnTitle, setNewColumnTitle] = useState("")

    const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      type: null, // 'task' or 'column'
      data: null // stores IDs needed for deletion
    })

    useEffect(() => {
        localStorage.setItem('theo-kanban-data', JSON.stringify(columns))
    }, [columns])

    

    //CRUD UTILITIES
    const addTask = (inputColumnID) => {
        //get unique task id
        const newTask = {
          id: `task-${Date.now()}`,
          text: '',
          priority: 'medium',
          description: '',
          isNew: true, //trigger edit mode automatically
          updatedAt: Date.now()
        }
        setColumns(columns.map(column => {
          if (column.id !== inputColumnID) return column
          return {...column, tasks: [...column.tasks, newTask]}
        }))
    }

    const updateTask = useCallback((columnID, taskID, updates) => {
      setColumns(prev => prev.map(column => {
        if (column.id !== columnID) return column;
        return {
          ...column, 
          tasks: column.tasks.map(task => {
                if (task.id === taskID) {
                    // ROOT CAUSE FIX: Check if isNew is already false
                    if (updates.isNew === false && task.isNew === false) {
                        return task; 
                    }
                    return { ...task, ...updates, updatedAt: Date.now() };
                }
                return task;
          })
        }
      }));
    }, []);
    
    const deleteTask = useCallback((columnID, taskID) => {
        setColumns(prev => prev.map(column => {
            if (column.id !== columnID) return column;
            return {
                ...column,
                tasks: column.tasks.filter(task => task.id !== taskID)
            };
        }));
    }, []);

    const addColumn = () => {
        const title = newColumnTitle.trim()
        if (!title) return
    
        const newColumn = {
          // eslint-disable-next-line react-hooks/purity
          id: `col-${Date.now()}`,
          title: title,
          tasks: []
        }
    
        setColumns([...columns, newColumn])
        closeColumnEditor()
    }

    const removeColumn = (columnID) => {
      setColumns(columns.filter(column => column.id !== columnID))
    }

    const openColumnEditor = () => setIsAddingColumn(true)

    const closeColumnEditor = () => {
      setIsAddingColumn(false)
      setNewColumnTitle("")
    }

    const openDeleteModal = (type, data) => {
      setModalConfig({isOpen: true, type, data})
    }

    const closeModal = () => {
      setModalConfig({isOpen: false, type: null, data: null})
    }

    const confirmDelete = () => {
      const {type, data} = modalConfig

      if (type === 'column') {
        removeColumn(data.columnID)
      } else if (type === 'task') {
        deleteTask(data.columnID, data.taskID)
      }
      closeModal()
    }

    //Drag and Drop Handlers
    const handleDragStart = (event) => {
      const {active} = event
      //Find task object from columns state
      const task = columns.flatMap(column => column.tasks).find(task => task.id === active.id)
      setActiveTask(task)
    }

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
      // eslint-disable-next-line no-unused-vars
      const cleanedTask = {...activeTask, isNew: false}

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
    setActiveTask(null) 
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
      const cleanedTask = {...activeTask, isNew: false} //ensure the editing state is false as you drag&drop
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
          newTasks.splice(newIndex, 0, cleanedTask) //Insert selected task at new index
          return {...column, tasks: newTasks}
        }
        return column
      })
    })
    
  }


  return { 
    columns, 
    setColumns,
    activeTask, 
    isAddingColumn, 
    newColumnTitle, 
    setNewColumnTitle,
    openColumnEditor,
    closeColumnEditor, 
    addTask, 
    updateTask, 
    deleteTask, 
    addColumn, 
    removeColumn,
    modalConfig,
    openDeleteModal,
    closeModal,
    confirmDelete, 
    handleDragStart, 
    handleDragOver, 
    handleDragEnd
  }
}