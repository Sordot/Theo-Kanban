import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DroppableContainer from './DroppableContainer'
import SortableTask from "./SortableTask"

export default function Column ({column, onAddTask, onDeleteTask, onRemoveColumn}) {
    return (
        <div className='kanban-column' key={column.id}>
            <div className="column-header">
                <h3 className='column-title'>{column.title}</h3>
                <div className="column-controls">
                    <button className='add-task-btn' onClick={() => onAddTask(column.id)}>+</button>
                    <button className="delete-column-btn" onClick={() => onRemoveColumn(column.id)}>x</button>
                </div>
            </div>
            {/* map each task for for each column */}
            <SortableContext id={column.id} items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            <DroppableContainer id={column.id} className='task-list'>
                {column.tasks.map((task) => (
                <SortableTask 
                    key={task.id}
                    id={task.id}
                    task={task}
                    columnID={column.id}
                    onDelete={onDeleteTask}
                />
                ))}
            </DroppableContainer>
            </SortableContext>
        </div>
    )
}