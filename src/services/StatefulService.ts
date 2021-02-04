export abstract class StatefulService<State> {
  private callbacks: Array<(state: State) => void> = [];
  private cb?: (state: State) => void;
  protected state: State;

  constructor(initialState: State) {
    this.state = initialState;
  }

  public async subscribe(cb: (state: State) => void) {
    this.callbacks.push(cb);
  }
  public async unsubscribe(cb: (state: State) => void) {
    const idx = this.callbacks.indexOf(cb);
    if (idx >= 0) {
      this.callbacks = [
        ...this.callbacks.slice(0, idx),
        ...this.callbacks.slice(idx, this.callbacks.length),
      ];
    }
  }
  public async onStateChange(cb: (state: State) => void) {
    this.cb = cb;
  }

  public getState(): State {
    return this.state;
  }

  protected setState(state: State) {
    this.state = state;
    if (this.cb) {
      this.cb(state);
    }
    for (const cb of this.callbacks) {
      cb(state);
    }
    console.log("called set state", this.state);
  }

  protected updateState(patch: Partial<State>) {
    this.setState({ ...this.state, ...patch });
  }
}
