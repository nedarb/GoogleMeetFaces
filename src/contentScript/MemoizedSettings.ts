import { loadAllSettings, Settings } from "../shared/settings";

export class MemoizedSettings {
  private currentSettings: Promise<Settings>;
  public reload(): Promise<Settings> {
    this.currentSettings = loadAllSettings();
    return this.currentSettings;
  }

  getSettings(): Promise<Settings> {
    if (!this.currentSettings) {
      this.currentSettings = loadAllSettings();
    }
    return this.currentSettings;
  }
}
