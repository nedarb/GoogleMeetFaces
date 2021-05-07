enum PollerState {
  Running,
  Stopped,
}

export class Poller {
  private timeoutId: number;
  private currentState = PollerState.Stopped;
  constructor(
    /** a function to run on each timeout, returning true if we should continue polling */
    private readonly fn: (poller: Poller) => Promise<boolean>,
    private readonly duration: number = 1000
  ) {}

  private async onTimeout() {
    const proceed = await this.fn(this);
    if (proceed) {
      this.timeoutId = setTimeout(this.onTimeout.bind(this), this.duration);
    } else {
      this.stop();
    }
  }

  start() {
    if (this.state === PollerState.Running) {
      this.stop();
    }

    this.currentState = PollerState.Running;
    this.onTimeout();
  }

  stop() {
    clearTimeout(this.timeoutId);
    this.currentState = PollerState.Stopped;
  }

  get state(): PollerState {
    return this.currentState;
  }
}
