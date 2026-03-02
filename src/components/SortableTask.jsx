import { memo, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const SortableTask = memo(({id, task, columnID, onDelete, onUpdate}) => {
    const [isEditing, setIsEditing] = useState(task.isNew || false)
    const [editData, setEditData] = useState({
        text: task.text || '', 
        description: task.description || '',
        priority: task.priority || ''
    })

    // eslint-disable-next-line no-unused-vars
    const { isNew } = task
    const isNewTask = !!task.isNew

    useEffect(() => {
    if (isNewTask && !isEditing) {
        const timer = setTimeout(() => {
            onUpdate(columnID, id, { isNew: false });
        }, 1000); // Matches your 1s CSS animation duration
        
        return () => clearTimeout(timer);
    }
        }, [isNewTask, isEditing, columnID, id, onUpdate]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({id, disabled: isEditing}) //stop dragging while typing

    const handleSave = () => {
        const finalData = {...editData, isNew: true}
        onUpdate(columnID, id, finalData)
        setIsEditing(false)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') handleSave()
        if (event.key === 'Escape') setIsEditing(false)
    }

    const formatTime = (ts) => {
        if (!ts) return ''
        return new Date(ts).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const cyclePriority = (e) => {
      e.stopPropagation()
      const levels = ['low', 'medium', 'high']
      const currentIndex = levels.indexOf(task.priority || 'medium')
      const nextPriority = levels[(currentIndex + 1) % levels.length]
      
      onUpdate(columnID, id, { ...task, priority: nextPriority })
    };

    const style = {
        transform: CSS.Transform.toString(transform), 
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.3 : 1 //fade placeholder to 0.3 when item is picked up
    }

    if (isEditing) {
        return (
            <div ref={setNodeRef} style={style} className='task-card editing' onKeyDown={handleKeyDown}>
                <input 
                    className='edit-input title'
                    value={editData.text}
                    onPointerDown={e => e.stopPropagation()}
                    onChange={e => setEditData({...editData, text: e.target.value})}
                    placeholder='Task title...'
                    autoFocus
                />
                <select 
                    className='edit-input priority'
                    value={editData.priority}
                    onPointerDown={e => e.stopPropagation()}
                    onChange={e => setEditData({...editData, priority: e.target.value})}
                >
                    <option value='low'>Low Priority</option>
                    <option value='medium'>Medium Priority</option>
                    <option value='high'>High Priority</option>
                </select>
                <textarea 
                    className='edit-input desc'
                    value={editData.description}
                    onPointerDown={e => e.stopPropagation()}
                    onChange={e => setEditData({...editData, description: e.target.value})}
                    placeholder='Add a description...'
                />
                <div className='edit-actions'>
                    <button className='save-btn' onClick={handleSave} onPointerDown={e => e.stopPropagation()}>Save Task</button>
                    <button className='cancel-btn' onClick={() => setIsEditing(false)} onPointerDown={e => e.stopPropagation()}>Cancel</button>
                </div>
            </div>
        )
    }
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`task-card priority-${task.priority} ${task.isNew ? 'is-new-flash' : ''}`}>
            <div className='task-content'>
                <div className='task-header'>
                    <span className={`priority-badge ${task.priority || 'medium'}`} onClick={cyclePriority} style={{cursor: 'pointer'}}title={'Click to cycle priority'}>
                        {(task.priority || 'medium').toUpperCase()}
                    </span>
                    <button className='edit-btn'
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                        ✎ Edit
                        </button>
                    <button className='delete-btn' 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) =>{e.stopPropagation(); onDelete(columnID, id)}}>
                        x
                    </button>
                </div>
                <p className='task-text'>{task.text}</p>
                {task.description && (<p className='task-desc-preview'>{task.description}</p>)}
                <div className='task-footer'>
                    <span className='timestamp'>
                        Updated: {formatTime(task.updatedAt)}
                    </span>
                </div>
            </div>
        </div>
    )
})

export default SortableTask