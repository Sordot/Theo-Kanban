import { memo, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getNextPriority } from '../hooks/useKanban';

const SortableTask = memo(({ id, task, columnID, onDelete, onUpdate, onOpenModal }) => {

    const isNewTask = !!task.isNew;
    const issueIcons = {
        "User Story": "📗",
        "Bug": "🐞",
        "Test": "🧪",
        "Spike": "⏱️"
    };

    // Keep the flash animation effect
    useEffect(() => {
        if (isNewTask) {
            const timer = setTimeout(() => {
                onUpdate(columnID, id, { isNew: false });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isNewTask, columnID, id, onUpdate]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const formatTime = (ts) => {
        if (!ts) return ''
        return new Date(ts).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    const cyclePriority = (e) => {
        e.stopPropagation()
        onUpdate(columnID, id, { ...task, priority: getNextPriority(task.priority) })
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.3 : 1
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`task-card priority-${task.priority} ${task.isNew ? 'is-new-flash' : ''}`}>
            <div className='task-content'>
                <div className='task-header'>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span title={task.issueType || "User Story"}>
                        {issueIcons[task.issueType || "User Story"]}
                    </span>
                    <span className={`priority-badge ${task.priority || 'Medium'}`}
                        onPointerDown={(e) => e.stopPropagation()} onClick={cyclePriority}
                        style={{ cursor: 'pointer' }}
                        title={'Click to cycle priority'}
                    >
                        {(task.priority || 'Medium').toUpperCase()}
                    </span>
                    </div>
                    <div>
                        <button
                            className='edit-btn'
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal(columnID, task);
                            }}>
                            📄
                        </button>
                        <button className='delete-btn'
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onDelete(columnID, id); }}>
                            x
                        </button>
                    </div>
                </div>
                <p className='task-text'>{task.text || 'Untitled Task'}</p>
                <div className='task-footer' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className='footer-label'>
                        {task.subtasks?.length || 0} {task.subtasks?.length === 1 ? 'Subtask' : 'Subtasks'}
                    </span>
                    <span className='footer-label'>
                        Updated: {formatTime(task.updatedAt)}
                    </span>
                </div>
            </div>
        </div>
    )
})

export default SortableTask