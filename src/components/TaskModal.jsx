import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TaskModal({ isOpen, task, onClose, onSave }) {
    const [isEditing, setIsEditing] = useState(false);

    const [text, setText] = useState("");
    const [priority, setPriority] = useState("medium")
    const [description, setDescription] = useState("");

    // Track the previous task ID to know when a new card is opened
    const [prevTaskId, setPrevTaskId] = useState(null);

    //Sync state before component render
    if (task && task.id !== prevTaskId) {
        setPrevTaskId(task.id);
        setDescription(task.description || "");
        setIsEditing(true);
        setIsEditing(task.text === 'New Task' || !task.description); //if new task or no title go straight to edit mode
    }

    if (!isOpen || !task) return null;

    const handleSave = () => {
        // Pass the updated description back up to your state manager
        onSave(task.id, { ...task, description });
        setIsEditing(false);
    };

    return (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content task-detail-modal">
                <div className="modal-header">
                    {/* Fallback to title or content depending on your data structure */}
                    <h2 className="modal-title">{isEditing ? text : task.text}</h2>
                </div>
                
                <div className="task-modal-body">
                    <div className="tabs">
                        <button 
                            className={isEditing ? "active" : ""} 
                            onClick={() => setIsEditing(true)}
                        >
                            Write
                        </button>
                        <button 
                            className={!isEditing ? "active" : ""} 
                            onClick={() => setIsEditing(false)}
                        >
                            Preview
                        </button>
                    </div>

                    {isEditing ? (
                        <textarea 
                            className="markdown-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add user stories, acceptance criteria, or technical notes here..."
                            rows="12"
                            autoFocus
                        />
                    ) : (
                        <div className="markdown-preview">
                            {description ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {description}
                                </ReactMarkdown>
                            ) : (
                                <p className="empty-state">No description provided.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="modal-btn cancel" onClick={onClose}>Close</button>
                    {isEditing && (
                        <button className="modal-btn confirm-green" onClick={handleSave}>
                            Save Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}