import React from 'react';

const issueIcons = {
  "User Story": "📗",
  "Bug": "🐞",
  "Test": "🧪",
  "Spike": "⏱️"
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


  //Cycle Time calculations
  let avgCycleTimeDisplay = "0 days";
  let cycleTimeColor = "#94a3b8";

  if (doneColumn && doneColumn.tasks.length > 0) {
    let totalCycleTimeMs = 0;
    let validTasksCount = 0;

    doneColumn.tasks.forEach(task => {
      // Extract the creation timestamp from the ID (e.g., "task-1710151800000" -> 1710151800000)
      const idParts = task.id.split('-');
      if (idParts.length > 1) {
        const createdAtMs = parseInt(idParts[1], 10);
        
        // Ensure it's a valid number and the task has an updatedAt timestamp
        if (!isNaN(createdAtMs) && task.updatedAt) {
          totalCycleTimeMs += (task.updatedAt - createdAtMs);
          validTasksCount++;
        }
      }
    });

    // Calculate the average
    if (validTasksCount > 0) {
      const avgMs = totalCycleTimeMs / validTasksCount;
      const ONE_HOUR_MS = 1000 * 60 * 60;
      const ONE_DAY_MS = ONE_HOUR_MS * 24;

      const avgDays = avgMs / ONE_DAY_MS;
      
      // 1. Determine the color based on thresholds
      if (avgDays < 3) {
        cycleTimeColor = '#4ade80'; // Green (Fast)
      } else if (avgDays < 7) {
        cycleTimeColor = '#fbbf24'; // Amber/Yellow (Moderate)
      } else {
        cycleTimeColor = '#ef4444'; // Red (Slow)
      }

      // 2. Format the display text
      if (avgDays < 1) {
        const avgHours = avgMs / ONE_HOUR_MS;
        avgCycleTimeDisplay = `${avgHours.toFixed(1)} hrs`;
      } else {
        avgCycleTimeDisplay = `${avgDays.toFixed(1)} days`;
      }
    }
  }

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
        <div>Avg Cycle Time: <span style={{ color: cycleTimeColor }}>{avgCycleTimeDisplay}</span></div>
      </div>
      <div className="progress-container">
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="progress-text">{progressPercent}%</div>
      </div>
    </div>
  );
};

export default AnalyticsBar;