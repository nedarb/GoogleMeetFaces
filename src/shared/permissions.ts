import browser, { Permissions } from "webextension-polyfill";

export const ACTIVE_TAB_PERMISSION: Permissions.Permissions = {
    permissions: ["activeTab"],
};
