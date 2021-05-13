import React, { useEffect, useState } from "react";
import { browser } from "webextension-polyfill-ts";
import { bindToTabSendMessage } from "../../shared/bindings";
import { ContentScript, Participant } from "../../shared/ContentScript";
import {
  loadAllSettings,
  saveSetting,
  Settings,
  SettingsKey,
} from "../../shared/settings";
import "./Popup.scss";

const IconPaths = {
  Enabled: {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png",
  },
  Disabled: {
    "16": "icon16_disabled.png",
    "48": "icon48_disabled.png",
    "128": "icon128_disabled.png",
  },
};

console.log(
  "foobar",
  __IN_DEBUG__,
  browser.runtime.getURL("debug.html"),
  browser.runtime.getURL("js/debug.js")
);

function getCurrentTabProxy(): Promise<ContentScript | undefined> {
  return browser.tabs
    .query({
      active: true,
      currentWindow: true,
      url: "https://meet.google.com/*",
    })
    .then((tabs) => {
      if (tabs.length === 1) {
        const [tab] = tabs;
        return bindToTabSendMessage<ContentScript>(tab);
      }
    });
}

function getAllTabProxies(): Promise<Array<ContentScript>> {
  return browser.tabs
    .query({
      url: "https://meet.google.com/*",
    })
    .then((tabs) => {
      return tabs.map((tab) => bindToTabSendMessage<ContentScript>(tab));
    });
}

async function broadcastSettingChange() {
  const proxy = await getCurrentTabProxy();
  if (proxy) {
    proxy.settingsChanged();
  } else {
    const proxies = await getAllTabProxies();
    console.log(
      `broadcasting settingsChanged to ${proxies.length} Google Meet${
        proxies.length === 1 ? "" : "s"
      }`
    );
    proxies.forEach((proxy) => proxy.settingsChanged());
  }
}

export default function Popup() {
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [participants, setParticipants] = useState<
    Readonly<Array<Participant>>
  >([]);

  const [currentSettings, setSettings] = useState<Settings | undefined>();

  useEffect(() => {
    async function run() {
      const settings = await loadAllSettings();
      setSettings(settings);

      // make sure the icon is the proper one
      await browser.browserAction.setIcon({
        path: !settings.isEnabled ? IconPaths.Disabled : IconPaths.Enabled,
      });

      const proxy = await getCurrentTabProxy();
      if (proxy) {
        const participants = await proxy.getParticipants();
        setParticipants(participants);
      } else {
        setError("You're not on a Google Meet!");
      }
    }

    run().finally(() => setIsBusy(false));
  }, []);

  const renderParticipants = () => {
    return (
      <div>
        Current Google Meet participants
        <ul className="participants">
          {participants.map((p) => (
            <li key={p.id}>
              <span className="name">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const toggleSetting = async (key: SettingsKey) => {
    const current = currentSettings[key];
    const next = !current;
    await saveSetting(key, next);
    setSettings({ ...currentSettings, [key]: next });
    await broadcastSettingChange();
    return next;
  };

  const toggleEnabled = async () => {
    const isEnabled = await toggleSetting(SettingsKey.IS_ENABLED);
    await browser.browserAction.setIcon({
      path: isEnabled ? IconPaths.Enabled : IconPaths.Disabled,
    });
  };

  return (
    <div className="popupContainer">
      {error}
      {participants.length > 0 && renderParticipants()}
      {error && (
        <a href="https://meet.new" target="_blank">
          Start a new meeting
        </a>
      )}
      {isBusy && <span>loading...</span>}
      <span>
        <input
          id="isEnabled"
          type="checkbox"
          checked={currentSettings?.isEnabled}
          onChange={() => toggleEnabled()}
        />{" "}
        Enable
      </span>
      <span>
        <input
          type="checkbox"
          checked={currentSettings?.includeYou}
          onChange={() => toggleSetting(SettingsKey.INCLUDE_YOU)}
        />{" "}
        Include you in picture-in-picture
      </span>
      <span>
        <input
          type="checkbox"
          checked={currentSettings?.debugging}
          onChange={() => toggleSetting(SettingsKey.DEBUGGING)}
        />{" "}
        Debugging mode{" "}
        {__IN_DEBUG__ && (
          <a href={browser.runtime.getURL("debug.html")} target="_blank">
            (details)
          </a>
        )}
      </span>
      <span>
        <input
          type="checkbox"
          checked={currentSettings?.highlightNoVideo}
          onChange={() => toggleSetting(SettingsKey.HIGHLIGHT_WHEN_NO_VIDEO)}
        />{" "}
        Highlight when no video
      </span>
    </div>
  );
}
