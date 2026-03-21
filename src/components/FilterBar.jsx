import React from 'react';
import { FaSearch } from 'react-icons/fa';

// Notice we now accept the 'filters' object and a 'setFilters' function
export default function FilterBar({ filters, setFilters, uniqueAssignees }) {

    // Helper to update a single property in our filter object
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearAllFilters = () => {
        setFilters({ text: '', priority: '', issueType: '', effort: '', environment: '', assignee: '' });
    };

    const hasActiveFilters = filters.text || filters.priority || filters.issueType || filters.effort || filters.environment || filters.assignee;

    return (
        <div className="filter-container" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* The Original Text Search */}
            <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Filter for tasks..."
                    value={filters.text}
                    onChange={(e) => handleFilterChange('text', e.target.value)}
                    className="search-input"
                />
            </div>

            {/* 👇 The Dynamic Assignee (Wizards) Dropdown */}
            <select 
                className="filter-dropdown"
                value={filters.assignee} 
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
            >
                <option value="">All Assignees</option>
                {/* Map over the unique assignees to generate the options */}
                {uniqueAssignees.map(assignee => (
                    <option key={assignee} value={assignee}>
                        🧙‍♂️ {assignee}
                    </option>
                ))}
            </select>

            {/* Advanced "Scrying" Selectors */}
            <select 
                className="filter-dropdown"
                value={filters.priority} 
                onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
                <option value="">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
            </select>

            <select 
                className="filter-dropdown"
                value={filters.issueType} 
                onChange={(e) => handleFilterChange('issueType', e.target.value)}
            >
                <option value="">All Types</option>
                <option value="User Story">📜 User Story</option>
                <option value="Bug">🦠 Bug</option>
                <option value="Test">🔮 Test</option>
                <option value="Spike">⌛ Spike</option>
            </select>

            <select 
                className="filter-dropdown"
                value={filters.environment} 
                onChange={(e) => handleFilterChange('environment', e.target.value)}
            >
                <option value="">All Envs</option>
                <option value="Dev">🧙‍♂️ Dev</option>
                <option value="QA">🕵 QA</option>
                <option value="Staging">🏗️ Staging</option>
                <option value="Production">🏰 Production</option>
            </select>

            <button 
                className={`clear-filters-btn ${hasActiveFilters ? 'visible' : ''}`} 
                onClick={clearAllFilters}
                aria-label="Clear all filters"
            >
                ❌
            </button>
        </div>
    );
}