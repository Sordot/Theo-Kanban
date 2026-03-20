import React from 'react';

const issueIcons = {
  "User Story": "📜",
  "Bug": "🌀",
  "Test": "🔮",
  "Spike": "⌛"
};

const AnalyticsBar = ({ columns }) => {
  // Calculate board statistics safely based on the columns prop
  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0);
  const doneColumn = columns.find(col => col.title.toLowerCase() === 'done');
  const doneTasks = doneColumn ? doneColumn.tasks.length : 0;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const highPriorityCount = columns.reduce((acc, col) =>
    acc + col.tasks.filter(t => t.priority === 'High').length, 0
  );

  //calculate issue type distribution
  const issueTypeCounts = columns.reduce((acc, col) => {
    col.tasks.forEach(task => {
      // Default to "User Story" if no issue type is set, matching App.jsx logic
      const type = task.issueType || "User Story";
      acc[type] = (acc[type] || 0) + 1;
    });
    return acc;
  }, {});

  return (
    <div className="analytics-bar">
      <div className="analytics-stats">
        <div>Total Tasks: <span>{totalTasks}</span></div>
        <div className="issue-distribution">
          Issues:
          <span className="issue-icons-container">
            {totalTasks === 0 && "0"}
            {Object.entries(issueIcons).map(([type, icon]) => {
              const count = issueTypeCounts[type] || 0;
              if (count === 0) return null;
              return (
                <span
                  key={type}
                  title={type}
                  className="issue-icon-item"
                >
                  {icon} {count}
                </span>
              );
            })}
          </span>
        </div>
        <div>High Priority: <span>{highPriorityCount}</span></div>
      </div>
      <div className="progress-bar-container">
        <div className="mana-tube-glass">
          <div
            className="mana-liquid"
            style={{ width: `${progressPercent}%` }}
          >
          </div>
        </div>
        <span className="progress-text">{progressPercent}% Done</span>
      </div>
    </div>
  );
};

export default AnalyticsBar;