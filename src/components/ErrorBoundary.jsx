import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an analytics service here
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <p>We encountered a cosmic interference.</p>
          <button onClick={() => window.location.reload()}>
            Refresh System
          </button>
          <button 
            style={{marginTop: '10px', opacity: 0.6}} 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            Reset All Data (Safe Mode)
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;