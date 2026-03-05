import { useState, useEffect, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";

export const getNextPriority = (currentPriority) => {
  const levels = ['Low', 'Medium', 'High'];
  const currentIndex = levels.indexOf(currentPriority || 'Medium');
  return levels[(currentIndex + 1) % levels.length];
};

export const getNextEffort = (currentEffort) => {
    const EFFORT_LEVELS = ["Small", "Medium", "Large", "X-Large"];
    const currentIndex = EFFORT_LEVELS.indexOf(currentEffort);
    // If not found or at the end of the list, loop back to the first item
    if (currentIndex === -1 || currentIndex === EFFORT_LEVELS.length - 1) {
        return EFFORT_LEVELS[0];
    }
    return EFFORT_LEVELS[currentIndex + 1];
};

export const useKanban = (initialData) => {

  const [boards, setBoards] = useState(() => {
    const saved = localStorage.getItem('theo-kanban-boards');
    return saved ? JSON.parse(saved) : initialData;
  });
  const [activeBoardID, setActiveBoardID] = useState(boards[0].id)

  //get the columns for the currently selected board
  const activeBoard = boards.find(board => board.id === activeBoardID)
  const columns = activeBoard ? activeBoard.columns : []



  const [activeTask, setActiveTask] = useState(null)

  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'task' or 'column'
    data: null // stores IDs needed for deletion
  })

  const [modalRenameValue, setModalRenameValue] = useState('')

  const [taskModalConfig, setTaskModalConfig] = useState({
    isOpen: false,
    columnID: null,
    task: null
  })

  useEffect(() => {
    localStorage.setItem('theo-kanban-boards', JSON.stringify(boards))
  }, [boards])



  //CRUD UTILITIES
  const addBoard = () => {
    const newBoardID = `board-${Date.now()}`
    const newBoard = {
      id: newBoardID,
      name: '🌱 Untitled Project',
      columns: [
        { id: `col-${Date.now()}-1`, title: 'To Do', tasks: [] },
        { id: `col-${Date.now()}-2`, title: 'In Progress', tasks: [] },
        { id: `col-${Date.now()}-3`, title: 'Done', tasks: [] }
      ]
    }
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardID(newBoardID); // Automatically switch to the new board
  }

  const updateBoard = (boardID, updates) => {
    setBoards(prev => prev.map(board =>
      board.id === boardID ? { ...board, ...updates } : board
    ));
  };

  const deleteBoard = (boardID) => {
    if (boards.length <= 1) {
      alert("You must have at least one board!");
      return;
    }

    setBoards(prev => {
      const updatedBoards = prev.filter(board => board.id !== boardID);
      if (activeBoardID === boardID) {
        setActiveBoardID(updatedBoards[0].id);
      }
      return updatedBoards;
    });
  };

  const addTask = (inputColumnID) => {
    //get unique task id
    const newTask = {
      id: `task-${Date.now()}`,
      text: '',
      priority: 'Medium',
      description: '',
      isNew: true, //trigger edit mode automatically
      updatedAt: Date.now()
    }
    setTaskModalConfig({
      isOpen: true,
      columnID: inputColumnID,
      task: newTask,
    });
  }

  const insertTask = useCallback((columnID, newTask) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id !== activeBoardID) return board;
      return {
        ...board,
        columns: board.columns.map(col => {
          if (col.id === columnID) {
            return { ...col, tasks: [...col.tasks, newTask] };
          }
          return col;
        })
      };
    }));
  }, [activeBoardID]);

  const updateTask = useCallback((columnID, taskID, updates) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id !== activeBoardID) return board;
      return {
        ...board,
        columns: board.columns.map(column => {
          if (column.id !== columnID) return column;
          return {
            ...column,
            tasks: column.tasks.map(task => {
              if (task.id === taskID) {
                // if (updates.isNew === false && task.isNew === false) return task; STRICT check
                return { ...task, ...updates, updatedAt: Date.now() };
              }
              return task;
            })
          };
        })
      };
    }));
  }, [activeBoardID]);

  const deleteTask = useCallback((columnID, taskID) => {
    setBoards(prevBoards => prevBoards.map(board => {
      // Only update columns if this is the board we are currently viewing
      if (board.id !== activeBoardID) return board;
      return {
        ...board,
        columns: board.columns.map(col => {
          if (col.id !== columnID) return col;
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskID)
          };
        })
      };
    }));
  }, [activeBoardID]);

  const addColumn = () => {
    const title = newColumnTitle.trim()
    if (!title) return

    const newColumn = {
      // eslint-disable-next-line react-hooks/purity
      id: `col-${Date.now()}`,
      title: title,
      tasks: []
    }

    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id !== activeBoardID) return board
      return { ...board, columns: [...board.columns, newColumn] };
    }));
    closeColumnEditor()
  }

  const removeColumn = (columnID) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id !== activeBoardID) return board;
      return { ...board, columns: board.columns.filter(col => col.id !== columnID) };
    }));
  }

  const openColumnEditor = () => setIsAddingColumn(true)

  const closeColumnEditor = () => {
    setIsAddingColumn(false)
    setNewColumnTitle("")
  }

  const openDeleteModal = (type, data) => {
    setModalConfig({ isOpen: true, type, data })
  }

  const closeModal = () => {
    setModalConfig({ isOpen: false, type: null, data: null })
  }

  const confirmDelete = () => {
    const { type, data } = modalConfig;

    if (type === 'column') {
      removeColumn(data.columnID);
    } else if (type === 'task') {
      deleteTask(data.columnID, data.taskID);
    } else if (type === 'board') {
      deleteBoard(data.boardID); // Uses your existing deleteBoard logic
    } else if (type === 'renameBoard') {
      updateBoard(data.boardID, { name: modalRenameValue }); // Uses your updateBoard logic
    }
    closeModal();
  };

  const openRenameModal = (board) => {
    setModalRenameValue(board.name);
    setModalConfig({
      isOpen: true,
      type: 'renameBoard',
      data: { boardID: board.id }
    });
  };

  const openTaskModal = (columnID, task) => {
    setTaskModalConfig({ isOpen: true, columnID, task });
  };

  const closeTaskModal = () => {
    setTaskModalConfig({ isOpen: false, columnID: null, task: null });
  };

  //Drag and Drop Handlers
  const handleDragStart = (event) => {
    const { active } = event
    //Find task object from columns state
    const task = columns.flatMap(column => column.tasks).find(task => task.id === active.id)
    setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeID = active.id;
    const overID = over.id;

    setBoards((prevBoards) => {
      return prevBoards.map(board => {
        // Guardrail: Only process drag logic for the active board
        if (board.id !== activeBoardID) return board;

        const activeColumn = board.columns.find(column => column.tasks.some(task => task.id === activeID));
        const overColumn = board.columns.find(column => column.id === overID || column.tasks.some(task => task.id === overID));

        if (!activeColumn || !overColumn) return board;

        // Handle same-column reordering
        if (activeColumn.id === overColumn.id) {
          const oldIndex = activeColumn.tasks.findIndex(task => task.id === activeID);
          const newIndex = activeColumn.tasks.findIndex(task => task.id === overID);

          return {
            ...board,
            columns: board.columns.map(column => {
              if (column.id === activeColumn.id) {
                return { ...column, tasks: arrayMove(column.tasks, oldIndex, newIndex) };
              }
              return column;
            })
          };
        }
        return board;
      });
    });
    setActiveTask(null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeID = active.id
    const overID = over.id

    setBoards((prevBoards) => {
      return prevBoards.map((board) => {
        // Only perform drag logic on the active board
        if (board.id !== activeBoardID) return board;

        const activeColumn = board.columns.find(col => col.tasks.some(task => task.id === activeID));
        const overColumn = board.columns.find(col => col.id === overID || col.tasks.some(task => task.id === overID));

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
          return board;
        }

        const activeTask = activeColumn.tasks.find(t => t.id === activeID);
        const cleanedTask = { ...activeTask, isNew: false };
        const overTasks = overColumn.tasks;

        const overIndex = overTasks.findIndex(t => t.id === overID);
        let newIndex = overIndex >= 0 ? overIndex : overTasks.length;

        return {
          ...board,
          columns: board.columns.map(column => {
            if (column.id === activeColumn.id) {
              return { ...column, tasks: column.tasks.filter(t => t.id !== activeID) };
            }
            if (column.id === overColumn.id) {
              const newTasks = [...column.tasks];
              newTasks.splice(newIndex, 0, cleanedTask);
              return { ...column, tasks: newTasks };
            }
            return column;
          })
        };
      });
    });
  }


  return {
    boards,
    addBoard,
    updateBoard,
    deleteBoard,
    activeBoardID,
    setActiveBoardID,
    columns,
    activeTask,
    isAddingColumn,
    newColumnTitle,
    setNewColumnTitle,
    openColumnEditor,
    closeColumnEditor,
    addTask,
    insertTask,
    updateTask,
    deleteTask,
    addColumn,
    removeColumn,
    modalConfig,
    openDeleteModal,
    closeModal,
    modalRenameValue,
    setModalRenameValue,
    openRenameModal,
    confirmDelete,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    taskModalConfig,
    setTaskModalConfig,
    openTaskModal,
    closeTaskModal
  }
}