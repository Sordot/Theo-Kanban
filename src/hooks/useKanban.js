import { useState, useEffect, useCallback, useMemo } from "react";
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


  const [filters, setFilters] = useState({
    text: '',
    priority: '',
    issueType: '',
    effort: '',
    environment: '',
    assignee: ''
  });
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
  const addBoard = useCallback(() => {
    const newBoard = {
      id: `board-${Date.now()}`,
      name: "🌱 Untitled Project",
      columns: [
        { id: `col-1-${Date.now()}`, title: "To Do", tasks: [] },
        { id: `col-2-${Date.now()}`, title: "In Progress", tasks: [] },
        { id: `col-3-${Date.now()}`, title: "Done", tasks: [] }
      ],
      isNew: true // Mark as new
    };

    setBoards(prev => [...prev, newBoard]);
    setActiveBoardID(newBoard.id);
  }, []);

  const updateBoard = (boardID, updates) => {
    setBoards(prev => prev.map(board =>
      board.id === boardID ? { ...board, ...updates } : board
    ));
  };

  const deleteBoard = useCallback((id) => {
    if (boards.length <= 1) return; // Prevent deleting the last board

    // 1. Mark the board for deletion
    setBoards(prev => prev.map(board =>
      board.id === id ? { ...board, isDeleting: true } : board
    ));

    // 2. Wait for animation (1s) then remove
    setTimeout(() => {
      setBoards(prev => {
        const filtered = prev.filter(board => board.id !== id);
        // Switch active board if the one we deleted was active
        if (activeBoardID === id && filtered.length > 0) {
          setActiveBoardID(filtered[0].id);
        }
        return filtered;
      });
    }, 1000);
  }, [boards.length, activeBoardID]);

  //Export board logic
  const exportBoard = useCallback(async () => {
    const boardToExport = boards.find(b => b.id === activeBoardID);
    if (!boardToExport) return;

    // 1. Data Cleaning
    const cleanBoard = {
      ...boardToExport,
      columns: boardToExport.columns.map(col => ({
        ...col,
        isDeleting: false,
        isNew: false,
        tasks: col.tasks.map(task => ({
          ...task,
          isDeleting: false,
          isNew: false
        }))
      }))
    };

    const dataStr = JSON.stringify(cleanBoard, null, 2);
    const fileName = `${boardToExport.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_grimoire.json`;

    // 2. The Modern "Scribe's Pact" (File System Access API)
    try {
      // Check if the browser supports the API
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'JSON Grimoire File',
            accept: { 'application/json': ['.json'] },
          }],
        });

        // Create a FileSystemWritableFileStream to write to.
        const writable = await handle.createWritable();

        // Write the contents of our file to the stream.
        await writable.write(dataStr);

        // Close the file and write the contents to disk.
        await writable.close();

        console.log("Successfully crystallized the grimoire to disk.");
      } else {
        // 3. Fallback: The Anchor Ritual (For Safari/Older Browsers)
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // Handle user cancellation or errors
      if (err.name !== 'AbortError') {
        console.error("The ritual failed:", err);
      }
    }
  }, [boards, activeBoardID]);

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
    // 1. First, mark the task as "deleting" to trigger the CSS
    updateTask(columnID, taskID, { isDeleting: true });

    // 2. Wait for the animation (1000ms matches the CSS duration)
    setTimeout(() => {
      setBoards(prevBoards => prevBoards.map(board => {
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
    }, 1000); // 1000ms delay
  }, [activeBoardID, updateTask]);

  // Helper to check if any filters are active (i.e. if they arent empty strings)
  const hasActiveFilters = filters.text.trim() !== '' || filters.priority !== '' ||
    filters.issueType !== '' || filters.effort !== '' ||
    filters.environment !== '' || filters.assignee !== '';

  // 2. DYNAMICALLY EXTRACT UNIQUE ASSIGNEES
  // This looks at all tasks and builds an alphabetical list of anyone assigned to a task
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set();
    columns.forEach(col => {
        col.tasks.forEach(task => {
            if (task.assignee && task.assignee.trim() !== "") {
                assignees.add(task.assignee.trim());
            }
        });
    });
    return Array.from(assignees).sort(); // Sort alphabetically for a clean dropdown
  }, [columns]);  

  const filteredColumns = useMemo(() => {
    if (!hasActiveFilters) {
        return columns.map(col => ({
          ...col,
          tasks: col.tasks.map(task => ({ ...task, searchStatus: 'none' }))
        }));
    }

    const lowerSearch = filters.text.toLowerCase();

    return columns.map(column => ({
      ...column,
      tasks: column.tasks.map(task => {
        const matchesText = !filters.text.trim() || 
          (task.text && task.text.toLowerCase().includes(lowerSearch)) || 
          (task.description && task.description.toLowerCase().includes(lowerSearch));
          
        const matchesPriority = !filters.priority || task.priority === filters.priority;
        const matchesIssueType = !filters.issueType || task.issueType === filters.issueType;
        const matchesEffort = !filters.effort || task.effort === filters.effort;
        const matchesEnvironment = !filters.environment || task.environment === filters.environment;
        
        // 3. Add the Assignee match check
        const matchesAssignee = !filters.assignee || task.assignee === filters.assignee;

        // 4. Require the assignee to match 
        const isMatch = matchesText && matchesPriority && matchesIssueType && matchesEffort && matchesEnvironment && matchesAssignee;

        return { 
            ...task, 
            searchStatus: isMatch ? 'matched' : 'obscured' 
        };
      })
    }));
  }, [columns, filters, hasActiveFilters]);

  const addColumn = () => {
    const title = newColumnTitle.trim()
    if (!title) return

    const newColumn = {
      // eslint-disable-next-line react-hooks/purity
      id: `col-${Date.now()}`,
      title: title,
      tasks: [],
      isNew: true
    }

    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id !== activeBoardID) return board
      return { ...board, columns: [...board.columns, newColumn] };
    }));
    closeColumnEditor()
  }

  const updateColumn = useCallback((columnID, updates) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id !== activeBoardID) return board;
      return {
        ...board,
        columns: board.columns.map(col => {
          if (col.id === columnID) {
            return { ...col, ...updates };
          }
          return col;
        })
      };
    }));
  }, [activeBoardID]);

  const clearColumn = useCallback((columnID) => {
    setBoards(prevBoards => prevBoards.map(board => {
      // Guardrail: only modify the active board
      if (board.id !== activeBoardID) return board;

      return {
        ...board,
        columns: board.columns.map(col => {
          if (col.id === columnID) {
            // Return the column with an empty tasks array
            return { ...col, tasks: [] };
          }
          return col;
        })
      };
    }));
  }, [activeBoardID]);

  const sortColumn = useCallback((columnID, sortType) => {
    setBoards(prevBoards => prevBoards.map(board => {
      // Guardrail: only modify the active board
      if (board.id !== activeBoardID) return board;

      return {
        ...board,
        columns: board.columns.map(col => {
          if (col.id === columnID) {
            // Create a copy of tasks to sort
            const sortedTasks = [...col.tasks].sort((a, b) => {

              // FIX: Use the native updatedAt property first! 
              // Falls back to parsing the ID, then defaults to 0 for 't1'/'t2'
              const timeA = a.updatedAt || parseInt(a.id.split('-')[1], 10) || 0;
              const timeB = b.updatedAt || parseInt(b.id.split('-')[1], 10) || 0;

              // Map priorities to numerical weights for sorting
              const priorityWeight = { 'Low': 1, 'Medium': 2, 'High': 3 };
              const effortWeight = { 'Small': 1, 'Medium': 2, 'Large': 3, 'X-Large': 4 };

              switch (sortType) {
                case 'newest':
                  return timeB - timeA; // Higher (newer) timestamp first
                case 'oldest':
                  return timeA - timeB; // Lower (older) timestamp first
                case 'alpha':
                  return (a.text || "").localeCompare(b.text || "");
                case 'effort':
                  return (effortWeight[b.effort] || 0) - (effortWeight[a.effort] || 0);
                case 'priority-desc':
                  return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
                case 'priority-asc':
                  return (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
                default:
                  return 0;
              }
            });
            return { ...col, tasks: sortedTasks };
          }
          return col;
        })
      };
    }));
  }, [activeBoardID]);

  const removeColumn = useCallback((columnID) => {
    // Mark the column as deleting first
    updateColumn(columnID, { isDeleting: true });

    // Wait for the 1000ms animation before removing from state
    setTimeout(() => {
      setBoards(prev => prev.map(board => {
        if (board.id !== activeBoardID) return board;
        return {
          ...board,
          columns: board.columns.filter(col => col.id !== columnID)
        };
      }));
    }, 1000);
  }, [activeBoardID, updateColumn]);

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
          //abort state update if dropped in original position to prevent rerender/flashing
          if (active.id === over.id) return board;
          const oldIndex = activeColumn.tasks.findIndex(task => task.id === activeID);
          let newIndex = activeColumn.tasks.findIndex(task => task.id === overID);
          // FIX: If dropped in the empty space below tasks, push to the end
          if (newIndex === -1 && overID === overColumn.id) {
            newIndex = activeColumn.tasks.length - 1;
          }

          return {
            ...board,
            columns: board.columns.map(column => {
              if (column.id === activeColumn.id) {
                // FIX: Only run arrayMove if dropped over an actual task (newIndex !== -1)
                // This hacky index check prevents the task card from snapping downward when moved between tasks
                if (newIndex !== -1) {
                  return { ...column, tasks: arrayMove(column.tasks, oldIndex, newIndex) };
                }
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
        let newIndex;
        if (overIndex >= 0) {
          // Check if active item is vertically below the over item's center
          // helps to prevent task cards from shifting on letting go
          const isBelowOverItem = over && active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height / 2;

          const modifier = isBelowOverItem ? 1 : 0;
          newIndex = overIndex + modifier;
        } else {
          // Dropped on empty column
          newIndex = overTasks.length;
        }

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
    exportBoard,
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
    filteredColumns,
    filters,
    setFilters,
    uniqueAssignees,
    addColumn,
    updateColumn,
    clearColumn,
    sortColumn,
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