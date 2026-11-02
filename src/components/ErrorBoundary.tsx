import { Component, type ReactNode } from "react";

interface Props {
  /** A change clears a caught failure. */
  resetKey: string;
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** `fallback` in place of children that threw while rendering; React logs the error itself. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidUpdate(previous: Props, previousState: State) {
    // Only a failure already on screen: the update that failed carries a new key too.
    if (previousState.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
