import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTask({id, task, columnID, onDelete}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({id: id})

    const style = {
        transform: CSS.Transform.toString(transform), transition
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className='task-card'>
            <span>{task.text}</span>
            <button 
                className='delete-btn' 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) =>{
                    e.stopPropagation()
                    onDelete(columnID, id)
                }}
            >x</button>
        </div>
    )
}

export default SortableTask