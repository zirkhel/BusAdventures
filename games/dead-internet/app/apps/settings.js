// @ts-check
// Settings: saves (export / import), restart, about.

import { h, icon } from "../ui.js";

/** Tips: on/off, the introduction again, all tips in one list, and \"Show intro tips again\". */
function tipsGroup(phone) {
  const T = phone.tips, S = phone.g.w.strings.tips || {};
  const toggle = /** @type {HTMLInputElement} */ (h("input.set-switch", { type: "checkbox", "aria-label": S.settingsShow }));
  toggle.checked = T.on;
  toggle.addEventListener("change", () => T.setOn(toggle.checked));
  return [h("div.set-head.muted", S.settingsHead),
    h("div.set-group",
      h("label.set-row", h("span", S.settingsShow), toggle),
      h("button.set-row.btnrow", { onclick: () => T.intro(true) }, h("span", S.settingsIntro), icon("back", "rot")),
      h("button.set-row.btnrow", { onclick: () => T.all() }, h("span", S.settingsAll), icon("back", "rot")),
      // Only forgets which tips were seen: nothing is shown now, and on/off stays as it is.
      h("button.set-row.btnrow.tips-reset", { onclick: () => { T.reset(); phone.toast(T.on ? S.settingsResetDone : S.settingsResetOff); } }, h("span", S.settingsReset))),
    h("div.set-hint.muted", S.settingsHint)];
}

export function settingsApp(phone) {
  const g = phone.g;
  return {
    id: "settings",
    root: () => ({ kind: "main" }),
    render(desc, canBack) {
      const file = /** @type {HTMLInputElement} */ (h("input", { type: "file", accept: "application/json,.json", style: { display: "none" } }));
      file.addEventListener("change", () => { if (file.files?.[0]) phone.host.importSave(file.files[0]); });
      return [h("div.topbar", phone.backButton(), h("div.bar-title", "Settings")),
        h("div.scroll", h("div.settings",
          h("div.set-group",
            h("div.set-row", h("span", "Name"), h("b", g.s.playerName)),
            h("div.set-row", h("span", "Day"), h("b", String(g.s.day))),
            h("div.set-row", h("span", "Actions"), h("b", String(g.s.log.length)))),
          h("div.set-hint.muted", "The game saves automatically on this device after every action."),
          tipsGroup(phone),
          h("div.set-group",
            h("button.set-row.btnrow", { onclick: () => phone.host.exportSave() }, h("span", "Export save"), icon("back", "rot")),
            h("button.set-row.btnrow", { onclick: () => file.click() }, h("span", "Import save"), icon("back", "rot")), file),
          h("div.set-group",
            h("button.set-row.btnrow.danger", { onclick: () => phone.sheet("Start over? Your current game on this device will be erased.", [
              { label: "Export save first", run: () => phone.host.exportSave() },
              { label: "Start over", danger: true, run: () => phone.host.restart() }]) }, h("span", "Start over"))),
          h("div.set-about.muted", `${g.w.meta.title} · content ${g.w.meta.contentVersion} · Bus Adventures`),
          h("a.set-about.lnk", { href: "../../" }, "Back to Bus Adventures")))];
    },
  };
}
