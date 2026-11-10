import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode | ((reset: () => void) => ReactNode);
};

type State = { hasError: boolean };

export class GameStageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  reset = () => {
    this.setState({ hasError: false });
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("A etapa do jogo não pôde ser exibida.", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return typeof this.props.fallback === "function"
      ? this.props.fallback(this.reset)
      : this.props.fallback;
  }
}
