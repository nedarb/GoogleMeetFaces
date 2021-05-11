import { browser } from "webextension-polyfill-ts";

export enum SettingsKey {
  IS_ENABLED = "isEnabled",
  INCLUDE_YOU = "includeYou",
  DEBUGGING = "debugging",
}
export interface Settings {
  [SettingsKey.INCLUDE_YOU]: boolean;
  [SettingsKey.IS_ENABLED]: boolean;
  [SettingsKey.DEBUGGING]: boolean;
}

const defaultSettings: Readonly<Settings> = {
  [SettingsKey.INCLUDE_YOU]: false,
  [SettingsKey.IS_ENABLED]: true,
  [SettingsKey.DEBUGGING]: false,
};

export async function loadAllSettings(): Promise<Readonly<Settings>> {
  const keys = Object.values(SettingsKey);
  const settings = await browser.storage.sync.get([...keys]);
  const finalSettings = { ...defaultSettings, ...settings };
  console.log(`loaded all settnigs: `, finalSettings);
  return finalSettings;
}

export function saveSettings(settings: Settings): Promise<void> {
  // turn settings into individual keys
  const data = Object.values(SettingsKey).map((k: SettingsKey) => ({
    [k]: settings[k],
  }));
  debugger;
  return browser.storage.sync.set(data);
}

export async function loadSetting<K extends keyof Settings>(
  key: K,
  defaultValue?: Settings[K]
): Promise<Settings[K]> {
  const values = await browser.storage.sync.get([key]);
  console.log(`values for ${key}:`, values);
  return values[key] ?? defaultValue;
}
export function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Promise<void> {
  return browser.storage.sync.set({ [key]: value });
}
