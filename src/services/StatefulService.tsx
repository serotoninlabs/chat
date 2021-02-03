export abstract class StatefulService<State> {
  private cb?: (state: State) => void;
  protected state!: State;

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
  }

  protected updateState(patch: Partial<State>) {
    this.setState({ ...this.state, ...patch });
  }
}
