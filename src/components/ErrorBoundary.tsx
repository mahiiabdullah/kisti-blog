import { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-paper text-center">
          <h1 className="text-4xl font-bn mb-4">দুঃখিত, একটি ত্রুটি হয়েছে</h1>
          <p className="text-muted-foreground font-en-sans mb-8">Something went wrong. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-foreground text-background font-en-sans text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors"
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
