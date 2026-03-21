import { memo, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTask = memo(({ id, task, columnID, onDelete, onUpdate, onOpenModal }) => {

    const isNewTask = task.isNew === true;
    const isDeleting = task.isDeleting === true;
    const issueIcons = {
        "User Story": "📜",
        "Bug": "🦠",
        "Test": "🔮",
        "Spike": "⌛"
    };

    const envIcons = {
        "Dev": "🧙‍♂️",
        "QA": "🕵",
        "Staging": "🏗️",
        "Production": "🏰"
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

    const style = {
        transform: CSS.Translate.toString(transform),
        transition: transition,
        opacity: isDragging ? 0.3 : 1
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`task-card priority-${task.priority} 
                ${isNewTask ? 'is-new' : ''} 
                ${isDeleting ? 'is-deleting' : ''}`}>
            <div className='task-content'>
                <div className='task-header'>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {task.assignee && (
                            <span
                                className="assignee-avatar"
                                data-tooltip={`${task.assignee}`}
                            >
                                {task.assignee.charAt(0).toUpperCase()}
                            </span>
                        )}
                        <span className="task-card-issue-icon" data-tooltip={`${task.issueType}`}>
                            {issueIcons[task.issueType || "📜"]}
                        </span>
                        <span className="task-card-env-icon" data-tooltip={`${task.environment}`}>
                                {envIcons[task.environment] || "🧙‍♂️"}
                            </span>
                    </div>
                    <div>
                        <button
                            className='edit-btn'
                            data-tooltip={'Edit task'}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal(columnID, task);
                            }}>
                            🔍
                        </button>
                        <button className='delete-btn'
                            data-tooltip={'Delete task'}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onDelete(columnID, id); }}>
                            ❌
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