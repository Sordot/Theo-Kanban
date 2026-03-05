import React, { useState, useEffect, useRef, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { getNextPriority } from "../hooks/useKanban";
import { getNextEffort } from "../hooks/useKanban"

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-toolbar">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
                Bold
            </button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
                Italic
            </button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>
                Strike
            </button>

            <div className="toolbar-divider"></div>

            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>
                H1
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
                H2
            </button>

            <div className="toolbar-divider"></div>

            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>
                Bullet List
            </button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
                Numbered List
            </button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>
                Quote
            </button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''}>
                Code
            </button>
        </div>
    );
};

export default function TaskModal({ isOpen, task, onClose, onSave }) {

    const [text, setText] = useState("");
    const [priority, setPriority] = useState("Medium")
    const [description, setDescription] = useState("")
    const [assignee, setAssignee] = useState("")
    const [issueType, setIssueType] = useState("User Story")
    const [effort, setEffort] = useState("Medium")
    const [environment, setEnvironment] = useState("Dev")
    const [dueDate, setDueDate] = useState(null)

    const [isEditingAssignee, setIsEditingAssignee] = useState(false)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isEditingDescription, setIsEditingDescription] = useState(false)

    // Track the previous task ID to know when a new card is opened
    const [prevTaskId, setPrevTaskId] = useState(null);

    // 1. Create a ref to track the latest state for our close handler
    const modalStateRef = useRef({ text, description, task, priority, assignee, issueType, effort, dueDate, environment });
    useEffect(() => {
        modalStateRef.current = { text, description, task, priority, assignee, issueType, effort, dueDate, environment };
    }, [text, description, task, priority, assignee, issueType, effort, dueDate, environment]);

    // 2. Create a smart close handler that auto-saves if you typed anything
    const handleModalClose = useCallback(() => {
        const {
            text: currentText,
            description: currentDesc,
            task: currentTask,
            priority: currentPriority,
            assignee: currentAssignee,
            issueType: currentIssueType,
            effort: currentEffort,
            dueDate: currentDueDate,
            environment: currentEnvironment
        } = modalStateRef.current;

        if (!currentTask) {
            onClose();
            return;
        }

        // Check if the user left the task completely blank/default
        const cleanDesc = currentDesc ? currentDesc.replace(/<[^>]*>?/gm, '').trim() : '';
        const isTitleBlank = !currentText || currentText.trim() === 'New Task' || currentText.trim() === '';
        const isDescBlank = !cleanDesc;

        if (currentTask.isNew && isTitleBlank && isDescBlank) {
            // It's empty and new -> tell App to delete it
            onClose(true);
        } else {
            // They typed something! Auto-save it and tell App NOT to delete it
            onSave(currentTask.id, {
                ...currentTask,
                text: currentText,
                description: currentDesc,
                priority: currentPriority,
                assignee: currentAssignee,
                issueType: currentIssueType,
                effort: currentEffort,
                dueDate: currentDueDate ? currentDueDate.toISOString() : null,
                environment: currentEnvironment
            });
            onClose(false);
        }
    }, [onClose, onSave]);

    const editor = useEditor({
        extensions: [StarterKit],
        content: task?.description || '',
        onUpdate: ({ editor }) => {
            setDescription(editor.getHTML());
        },
    }, [task?.id]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                handleModalClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleModalClose]);

    // Sync state safely using useEffect instead of doing it during render
    useEffect(() => {
        if (task && isOpen) {
            setText(task.text || "");
            setDescription(task.description || "")
            setPriority(task.priority || "Medium")
            setAssignee(task.assignee || "")
            setIssueType(task.issueType || "User Story")
            setEffort(task.effort || "Medium")
            setEnvironment(task.environment || "Dev")
            setDueDate(task.dueDate ? new Date(task.dueDate) : null)


            // Set initial editing states based on whether data exists
            setIsEditingTitle(task.text === 'New Task' || !task.text);
            setIsEditingDescription(!task.description);


            // Ensure TipTap updates if the task description changes externally
            if (editor && editor.getHTML() !== task.description) {
                editor.commands.setContent(task.description || '');
            }
        }
    }, [task, isOpen, editor]);

    if (!isOpen || !task) return null;

    // Save Handlers
    const handleTitleSave = () => {
        const finalTitle = text.trim() ? text : "Untitled Task"
        setText(finalTitle)
        setIsEditingTitle(false);
        onSave(task.id, { ...task, text: finalTitle, description, priority, assignee, effort });
    };

    const handleDescriptionSave = () => {
        setIsEditingDescription(false);
        onSave(task.id, { ...task, text, description, priority, assignee, effort });
    };

    const handleAssigneeSave = () => {
        setIsEditingAssignee(false);
        onSave(task.id, { ...task, text, description, priority, assignee, effort });
    };

    const handleDescriptionCancel = () => {
        setIsEditingDescription(false);
        // Revert to original task description if cancelled
        setDescription(task.description || "");
        editor.commands.setContent(task.description || '');
    };

    const handlePriorityCycle = () => {
        const nextPriority = getNextPriority(priority);
        setPriority(nextPriority);

        // Save immediately so the board background updates instantly
        onSave(task.id, { ...task, text, description, priority: nextPriority, assignee, effort });
    };

    const handleIssueTypeChange = (e) => {
        const newType = e.target.value;
        setIssueType(newType);
        onSave(task.id, { ...task, text, description, priority, assignee, issueType: newType, effort });
    };

    const handleEffortCycle = () => {
        const nextEffort = getNextEffort(effort);
        setEffort(nextEffort);
        onSave(task.id, { ...task, text, description, priority, assignee, issueType, effort: nextEffort });
    };

    const handleEnvironmentChange = (e) => {
        const newEnv = e.target.value;
        setEnvironment(newEnv);
        onSave(task.id, { ...task, text, description, priority, assignee, issueType, effort, environment: newEnv });
    };

    const handleDueDateChange = (date) => {
        setDueDate(date);
        onSave(task.id, {
            ...task,
            text, description, priority, assignee, issueType, effort, environment,
            dueDate: date ? date.toISOString() : null
        });
    };

    return (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) handleModalClose(); }}>
            <div className="modal-content task-detail-modal">
                <div className="modal-header">
                    <div className="modal-title-wrapper" style={{ alignItems: 'center' }}>
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                className="modal-title-input edit-input"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                placeholder="Task Title..."
                                style={{ fontSize: '1.25em', fontWeight: 'bold', width: '100%', padding: '4px' }}
                            />
                        ) : (
                            <h2
                                className="modal-title editable-field"
                                onClick={() => setIsEditingTitle(true)}
                                title="Click to edit title"
                            >
                                {text}
                            </h2>
                        )}
                    </div>
                    <button className="modal-close-x" onClick={handleModalClose}>X</button>
                </div>
                <div className="task-modal-body">
                    <div className="task-main-content">
                        <div className="description-section">
                            <h3 className="section-label" style={{ marginBottom: '8px', color: '#5e6c84', fontSize: '14px', textAlign: 'left', paddingLeft: '8px' }}>Key Details</h3>

                            {isEditingDescription ? (
                                <div className="rich-text-editor">
                                    <div className="tiptap-wrapper">
                                        <MenuBar editor={editor} />
                                        <EditorContent editor={editor} className="tiptap-container" />
                                    </div>
                                    <div className="editor-actions" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                        <button className="modal-btn confirm-green" onClick={handleDescriptionSave}>Save</button>
                                        <button className="modal-btn cancel" onClick={handleDescriptionCancel}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="tiptap-preview editable-field"
                                    onClick={() => setIsEditingDescription(true)}
                                    title="Click to edit description"
                                    style={{ minHeight: '60px' }}
                                >
                                    {description ? (
                                        <div dangerouslySetInnerHTML={{ __html: description }} />
                                    ) : (
                                        <p className="empty-state" style={{ color: '#888' }}>Add a more detailed description...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR (25%) */}
                    <div className="task-sidebar">
                        <div className="sidebar-field">
                            <label>Priority</label>
                            <button
                                className={`sidebar-value ${priority}`}
                                onClick={handlePriorityCycle}
                                title="Click to cycle priority"
                            >
                                {priority}
                            </button>
                        </div>
                        <div className="sidebar-field">
                            <label>Assignee</label>
                            {isEditingAssignee ? (
                                <input
                                    autoFocus
                                    className="sidebar-value edit-input"
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    onBlur={handleAssigneeSave}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAssigneeSave()}
                                    placeholder="Unassigned"
                                    style={{ width: '100%', padding: '2px 4px', boxSizing: 'border-box' }}
                                />
                            ) : (
                                <span
                                    className="sidebar-value"
                                    onClick={() => setIsEditingAssignee(true)}
                                    title={assignee ? `Assignee: ${assignee}` : "Click to assign"}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {assignee || "Unassigned"}
                                </span>
                            )}
                        </div>
                        <div className="sidebar-field">
                            <label>Issue Type</label>
                            <select
                                className="sidebar-value"
                                value={issueType}
                                onChange={handleIssueTypeChange}
                                style={{ appearance: 'auto', cursor: 'pointer' }}
                            >
                                <option value="User Story">User Story</option>
                                <option value="Bug">Bug</option>
                                <option value="Test">Test</option>
                                <option value="Spike">Spike</option>
                            </select>
                        </div>
                        <div className="sidebar-field">
                            <label>Effort</label>
                            <button
                                className="sidebar-value"
                                onClick={handleEffortCycle}
                                title="Click to cycle effort"
                            >
                                {effort}
                            </button>
                        </div>
                        <div className="sidebar-field">
                            <label>Due Date</label>
                            <DatePicker
                                selected={dueDate}
                                onChange={handleDueDateChange}
                                className="sidebar-value"
                                placeholderText="No date"
                                dateFormat="MMM d, yyyy" // e.g., "Oct 24, 2023"
                            />
                        </div>
                        <div className="sidebar-field">
                            <label>Environment</label>
                            <select
                                className="sidebar-value"
                                value={environment}
                                onChange={handleEnvironmentChange}
                                style={{ appearance: 'auto', cursor: 'pointer' }}
                            >
                                <option value="Dev">Dev</option>
                                <option value="QA">QA</option>
                                <option value="Staging">Staging</option>
                                <option value="Production">Production</option>
                            </select>
                        </div>
                    </div>

                </div>
            </div>

        </div>

    );
}