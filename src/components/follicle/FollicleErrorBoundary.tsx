"use client";

import { Component, type ReactNode } from "react";
import { FollicleFallback } from "@/components/follicle/FollicleFallback";

type State = { hasError: boolean };

/** Captura falha de chunk/WebGL em runtime e cai no PNG. */
export class FollicleErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <FollicleFallback />;
    return this.props.children;
  }
}
