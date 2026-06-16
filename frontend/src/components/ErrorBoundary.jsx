import React from "react";
import Button from "@/components/ui/Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
              Something went wrong
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              An unexpected error occurred. Please try again.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReset}>
                Try again
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Refresh page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
