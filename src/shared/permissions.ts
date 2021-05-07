import { browser, Permissions } from "webextension-polyfill-ts";

export const ACTIVE_TAB_PERMISSION: Permissions.Permissions = {
    permissions: ["activeTab"],
};
