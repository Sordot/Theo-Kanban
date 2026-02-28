import { useDroppable } from "@dnd-kit/core";

function DroppableContainer({id, children}) {
    const {setNodeRef} = useDroppable({id})
    return (
        <div ref={setNodeRef} className="task-list">
            {children}
        </div>
    )
}

export default DroppableContainer