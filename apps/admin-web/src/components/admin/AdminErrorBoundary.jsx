import React from "react";
import { Button } from "@lh/shared";

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border rounded-lg p-6 text-center space-y-3">
          <p className="text-sm text-gray-700">Something went wrong. Please refresh.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AdminErrorBoundary;
