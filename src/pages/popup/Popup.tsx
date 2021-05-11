import React, { useEffect, useState } from "react";
import { browser } from "webextension-polyfill-ts";
import { bindToTabSendMessage } from "../../shared/bindings";
import { IContentScript, Participant } from "../../shared/IContentScript";
import {
  loadAllSettings,
  saveSetting,
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

function getCurrentTabProxy(): Promise<IContentScript | undefined> {
  return browser.tabs
    .query({
      active: true,
      currentWindow: true,
      url: "https://meet.google.com/*",
    })
    .then((tabs) => {
      if (tabs.length === 1) {
        const [tab] = tabs;
        return bindToTabSendMessage<IContentScript>(tab);
      }
    });
}

function getAllTabProxies(): Promise<Array<IContentScript>> {
  return browser.tabs
    .query({
      url: "https://meet.google.com/*",
    })
    .then((tabs) => {
      return tabs.map((tab) => bindToTabSendMessage<IContentScript>(tab));
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
  const [includeYou, setIncludeYou] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [debuggingEnabled, setDebuggingEnabled] = useState(false);

  useEffect(() => {
    async function run() {
      const settings = await loadAllSettings();
      setIncludeYou(settings.includeYou);
      setIsEnabled(settings.isEnabled);
      setDebuggingEnabled(settings.debugging);

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

  const toggleIncludeYou = async () => {
    await saveSetting(SettingsKey.INCLUDE_YOU, !includeYou);
    setIncludeYou(!includeYou);
    await broadcastSettingChange();
  };

  const toggleDebugging = async () => {
    await saveSetting(SettingsKey.DEBUGGING, !debuggingEnabled);
    setDebuggingEnabled(!debuggingEnabled);
    await broadcastSettingChange();
  };

  const toggleEnabled = async () => {
    await saveSetting(SettingsKey.IS_ENABLED, !isEnabled);
    setIsEnabled(!isEnabled);
    await browser.browserAction.setIcon({
      path: isEnabled ? IconPaths.Disabled : IconPaths.Enabled,
    });
    await broadcastSettingChange();
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
      {isBusy && <span>logging in...</span>}
      <span>
        <input
          id="isEnabled"
          type="checkbox"
          checked={isEnabled}
          onChange={() => toggleEnabled()}
        />{" "}
        Enable
      </span>
      <span>
        <input
          type="checkbox"
          checked={includeYou}
          onChange={() => toggleIncludeYou()}
        />{" "}
        Include you in picture-in-picture
      </span>
      <span>
        <input
          type="checkbox"
          checked={debuggingEnabled}
          onChange={() => toggleDebugging()}
        />{" "}
        Debugging mode
      </span>
    </div>
  );
}
