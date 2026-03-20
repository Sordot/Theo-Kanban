import React, { useState, useEffect, useRef, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { getNextPriority } from "../hooks/useKanban";
import { getNextEffort } from "../hooks/useKanban"
import TipTapMenuBar from "./TipTapMenuBar";


export default function TaskModal({ isOpen, task, onClose, onSave }) {

    const [text, setText] = useState("");
    const [priority, setPriority] = useState("Medium")
    const [description, setDescription] = useState("")
    const [assignee, setAssignee] = useState("")
    const [issueType, setIssueType] = useState("User Story")
    const [effort, setEffort] = useState("Medium")
    const [environment, setEnvironment] = useState("Dev")
    const [dueDate, setDueDate] = useState(null)
    const [customFields, setCustomFields] = useState([])
    const [subtasks, setSubtasks] = useState([])
    const [newSubtaskText, setNewSubtaskText] = useState("")

    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isEditingAssignee, setIsEditingAssignee] = useState(false)
    const [isEditingDescription, setIsEditingDescription] = useState(false)
    const [editingCustomFieldId, setEditingCustomFieldId] = useState(null)

    const issueIcons = {
        "User Story": "📜",
        "Bug": "👻",
        "Test": "🔮",
        "Spike": "⌛"
    };

    const envIcons = {
        "Dev": "🧙‍♂️",
        "QA": "🕵",
        "Staging": "🏗️",
        "Production": "🏰"
    };

    // Track the previous task ID to know when a new card is opened
    const [prevTaskId, setPrevTaskId] = useState(null);

    // 1. Create a ref to track the latest state for our close handler
    const modalStateRef = useRef({ text, description, task, priority, assignee, issueType, effort, dueDate, environment, subtasks, customFields });
    useEffect(() => {
        modalStateRef.current = { text, description, task, priority, assignee, issueType, effort, dueDate, environment, subtasks, customFields };
    }, [text, description, task, priority, assignee, issueType, effort, dueDate, environment, subtasks, customFields]);

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
            environment: currentEnvironment,
            subtasks: currentSubtasks,
            customFields: currentCustomFields
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
                environment: currentEnvironment,
                subtasks: currentSubtasks
            }, true);
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
            setCustomFields((task.customFields || []).map(cf => ({ ...cf, isEditing: false })))
            setSubtasks(task.subtasks || []);


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
        onSave(task.id, { ...task, text: finalTitle, description, priority, assignee, effort, subtasks });
    };

    const handleDescriptionSave = () => {
        setIsEditingDescription(false);
        onSave(task.id, { ...task, text, description, priority, assignee, effort, subtasks });
    };

    const handleAssigneeSave = () => {
        setIsEditingAssignee(false);
        onSave(task.id, { ...task, text, description, priority, assignee, effort, subtasks });
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
        onSave(task.id, { ...task, text, description, priority: nextPriority, assignee, effort, subtasks });
    };

    const handleIssueTypeChange = (e) => {
        const newType = e.target.value;
        setIssueType(newType);
        onSave(task.id, { ...task, text, description, priority, assignee, issueType: newType, effort, subtasks });
    };

    const handleEffortCycle = () => {
        const nextEffort = getNextEffort(effort);
        setEffort(nextEffort);
        onSave(task.id, { ...task, text, description, priority, assignee, issueType, effort: nextEffort, subtasks });
    };

    const handleEnvironmentChange = (e) => {
        const newEnv = e.target.value;
        setEnvironment(newEnv);
        onSave(task.id, { ...task, text, description, priority, assignee, issueType, effort, environment: newEnv, subtasks });
    };

    const handleDueDateChange = (date) => {
        setDueDate(date);
        onSave(task.id, {
            ...task,
            text, description, priority, assignee, issueType, effort, environment,
            dueDate: date ? date.toISOString() : null, subtasks
        });
    };

    const handleAddSubtask = (e) => {
        if (e.key === 'Enter' && newSubtaskText.trim()) {
            const newSubtask = {
                id: `subtask-${Date.now()}`,
                text: newSubtaskText.trim(),
                completed: false
            };
            const updatedSubtasks = [...subtasks, newSubtask];
            setSubtasks(updatedSubtasks);
            setNewSubtaskText("");

            onSave(task.id, {
                ...task, text, description, priority, assignee, issueType, effort, environment, subtasks: updatedSubtasks
            });
        }
    };

    const handleToggleSubtask = (subtaskId) => {
        const updatedSubtasks = subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        setSubtasks(updatedSubtasks);
        onSave(task.id, {
            ...task, text, description, priority, assignee, issueType, effort, environment, subtasks: updatedSubtasks
        });
    };

    const handleDeleteSubtask = (subtaskId) => {
        const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId);
        setSubtasks(updatedSubtasks);
        onSave(task.id, {
            ...task, text, description, priority, assignee, issueType, effort, environment, subtasks: updatedSubtasks
        });
    };

    const handleAddCustomField = () => {
        // Add a new row with isEditing: true so it stays at the bottom
        const newFields = [...customFields, { id: `cf-${Date.now()}`, key: "", value: "", isEditing: true }];
        setCustomFields(newFields);

        const parentFields = newFields.map(({ isEditing, ...rest }) => rest);
        onSave(task.id, { ...task, text, description, priority, assignee, issueType, effort, environment, subtasks, customFields: parentFields });
    };

    // Only update local state while typing (no parent saving yet)
    const handleUpdateCustomField = (id, field, newValue) => {
        const newFields = customFields.map(cf =>
            cf.id === id ? { ...cf, [field]: newValue } : cf
        );
        setCustomFields(newFields);
    };


    // Save to parent when Enter is pressed or input loses focus
    const handleSaveCustomFields = (e, id) => {
        // If the user hits Escape, remove the field entirely if they were just adding it
        if (e && e.type === 'keydown' && e.key === 'Escape') {
            handleRemoveCustomField(id);
            return;
        }

        if (e && e.type === 'keydown' && e.key !== 'Enter') return;

        if (e && e.key === 'Enter') {
            e.target.blur(); // Trigger the blur event to consolidate the save logic below
            return;
        }

        // PREVENT TAB BUG: If blurring because the user pressed Tab to go to the sibling value input,
        // don't save yet! (We identify sibling inputs by checking for a shared custom class)
        if (e && e.type === 'blur' && e.relatedTarget && e.relatedTarget.className.includes(`cf-input-${id}`)) {
            return;
        }

        setEditingCustomFieldId(null);

        // If a new field has a key, flip it to "saved" so it jumps to the top
        const updatedFields = customFields.map(cf =>
            cf.isEditing && cf.key.trim() !== "" ? { ...cf, isEditing: false } : cf
        );

        const cleanedFields = updatedFields.filter(cf => cf.key.trim() !== "" || cf.value.trim() !== "");
        setCustomFields(cleanedFields);

        // Strip the isEditing flag before sending to the database/parent
        const parentFields = cleanedFields.map(({ isEditing, ...rest }) => rest);
        onSave(task.id, { ...task, priority, assignee, issueType, effort, environment, subtasks, customFields: parentFields });
    };

    const handleRemoveCustomField = (id) => {
        const newFields = customFields.filter(cf => cf.id !== id);
        setCustomFields(newFields);
        onSave(task.id, { ...task, priority, assignee, issueType, effort, environment, subtasks, customFields: newFields });
    };

    const formatTime = (ts) => {
        if (!ts) return ''
        return new Date(ts).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

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
                    <button className="modal-close-x" onClick={handleModalClose}>❌</button>
                </div>
                <div className="task-modal-body">
                    <div className="task-main-content">
                        <div className="description-section">
                            <h3 className="section-label">Key Details</h3>

                            {isEditingDescription ? (
                                <div className="rich-text-editor">
                                    <div className="tiptap-wrapper">
                                        <TipTapMenuBar editor={editor} />
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
                        <div className="subtasks-section">
                            <h3 className="section-label subtasks-label">
                                Subtasks
                            </h3>

                            <div className="subtasks-list">
                                {subtasks.map(subtask => (
                                    <div key={subtask.id} className="subtask-item">
                                        <input
                                            type="checkbox"
                                            className="subtask-checkbox"
                                            checked={subtask.completed}
                                            onChange={() => handleToggleSubtask(subtask.id)}
                                        />

                                        {/* Dynamically apply the 'completed' class based on state */}
                                        <span className={`subtask-text ${subtask.completed ? 'completed' : ''}`}>
                                            {subtask.text}
                                        </span>

                                        <button
                                            className="subtask-delete-btn"
                                            onClick={() => handleDeleteSubtask(subtask.id)}
                                            title="Delete subtask"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="text"
                                className="sidebar-value subtask-input"
                                placeholder="Add a subtask and press Enter..."
                                value={newSubtaskText}
                                onChange={(e) => setNewSubtaskText(e.target.value)}
                                onKeyDown={handleAddSubtask}
                            />
                        </div>
                    </div>

                    {/* SIDEBAR (25%) */}
                    <div className="task-sidebar">

                        <div className="sidebar-field-row">
                            <div className="sidebar-label-container">
                                Priority
                            </div>
                            <div className="sidebar-value-container">
                                <button
                                    className={`sidebar-value ${priority}`}
                                    onClick={handlePriorityCycle}
                                    title="Click to cycle priority"
                                >
                                    {priority}
                                </button>
                            </div>
                        </div>

                        <div className="sidebar-field-row">
                            <div className="sidebar-label-container">
                                Assignee
                            </div>
                            <div className="sidebar-value-container">
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
                        </div>

                        <div className="sidebar-field-row">
                            <div className="sidebar-label-container">
                                Issue Type
                            </div>
                            <div className="sidebar-value-container">
                                <select
                                    className="sidebar-value"
                                    value={issueType}
                                    onChange={handleIssueTypeChange}
                                    style={{ appearance: 'auto', cursor: 'pointer', width: '100%' }}
                                >
                                    {Object.entries(issueIcons).map(([label, icon]) => (
                                        <option key={label} value={label}>
                                            {icon} {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="sidebar-field-row">
                            <div className="sidebar-label-container">
                                Effort
                            </div>
                            <div className="sidebar-value-container">
                                <button
                                    className="sidebar-value"
                                    onClick={handleEffortCycle}
                                    title="Click to cycle effort"
                                >
                                    {effort}
                                </button>
                            </div>
                        </div>

                        <div className="sidebar-field-row">
                            <div className="sidebar-label-container">
                                Due Date
                            </div>
                            <div className="sidebar-value-container">
                                <DatePicker
                                    selected={dueDate}
                                    onChange={handleDueDateChange}
                                    className="sidebar-value"
                                    placeholderText="No date"
                                    dateFormat="MMM d, yyyy"
                                />
                            </div>
                        </div>

                        <div className="sidebar-field-row">
                            <div className="sidebar-label-container">
                                Environment
                            </div>
                            <div className="sidebar-value-container">
                                <select
                                    className="sidebar-value"
                                    value={environment}
                                    onChange={handleEnvironmentChange}
                                    style={{ appearance: 'auto', cursor: 'pointer', width: '100%' }}
                                >
                                    {Object.entries(envIcons).map(([label, icon]) => (
                                        <option key={label} value={label}>
                                            {icon} {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 1. SAVED CUSTOM FIELDS (Jumps up to match hardwired fields) */}
                        {customFields.filter(cf => !cf.isEditing).map(cf => (
                            <div key={cf.id} className="sidebar-field-row custom-field-saved">
                                <div className="sidebar-label-container" title={cf.key}>
                                    {cf.key}
                                </div>
                                <div className="sidebar-value-container" style={{ gap: '4px' }}>
                                    {editingCustomFieldId === cf.id ? (
                                        <input
                                            autoFocus
                                            className="sidebar-value edit-input"
                                            value={cf.value}
                                            onChange={(e) => handleUpdateCustomField(cf.id, 'value', e.target.value)}
                                            onBlur={(e) => handleSaveCustomFields(e, cf.id)}
                                            onKeyDown={(e) => handleSaveCustomFields(e, cf.id)}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: '2px 4px' }}
                                            placeholder="Empty"
                                        />
                                    ) : (
                                        <span
                                            className="sidebar-value"
                                            onClick={() => setEditingCustomFieldId(cf.id)}
                                            title={cf.value ? `Value: ${cf.value}` : "Click to edit"}
                                            style={{ cursor: 'pointer', width: '100%', display: 'inline-block' }}
                                        >
                                            {cf.value || "Empty"}
                                        </span>
                                    )}
                                    <button
                                        className="delete-cf-btn"
                                        onClick={() => handleRemoveCustomField(cf.id)}
                                        title="Remove field"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* 2. ADD CUSTOM FIELDS SECTION (Stays at the bottom) */}
                        <div className="custom-fields-section">
                            <div className="sidebar-field-row">
                                <div className="sidebar-value-container">
                                    <button className="custom-field-add-btn" onClick={handleAddCustomField}>
                                        + Add Custom Field
                                    </button>
                                </div>
                            </div>

                            <div className="custom-fields-list">
                                {customFields.filter(cf => cf.isEditing).map(cf => (
                                    <div key={cf.id} className="custom-field-item" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="Key..."
                                            value={cf.key}
                                            onChange={(e) => handleUpdateCustomField(cf.id, 'key', e.target.value)}
                                            onBlur={(e) => handleSaveCustomFields(e, cf.id)}
                                            onKeyDown={(e) => handleSaveCustomFields(e, cf.id)}
                                            className={`sidebar-value edit-input cf-input-${cf.id}`}
                                            style={{ width: '45%', padding: '2px 4px', boxSizing: 'border-box' }}
                                            autoFocus={cf.key === "" && cf.value === ""}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value..."
                                            value={cf.value}
                                            onChange={(e) => handleUpdateCustomField(cf.id, 'value', e.target.value)}
                                            onBlur={(e) => handleSaveCustomFields(e, cf.id)}
                                            onKeyDown={(e) => handleSaveCustomFields(e, cf.id)}
                                            className={`sidebar-value edit-input cf-input-${cf.id}`}
                                            style={{ width: '45%', padding: '2px 4px', boxSizing: 'border-box' }}
                                        />
                                        <button
                                            className="delete-cf-btn"
                                            onClick={() => handleRemoveCustomField(cf.id)}
                                            title="Remove field"
                                            style={{ opacity: 1, position: 'relative' }}
                                        >
                                            ❌
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
                {task?.updatedAt && (
                    <div className="modal-footer">
                        <span className="footer-label">
                            Updated: {formatTime(task.updatedAt)}
                        </span>
                    </div>
                )}
            </div>
        </div>

    );
}