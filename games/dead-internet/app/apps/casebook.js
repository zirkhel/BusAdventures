// @ts-check
// Casebook. Phase 2: the list of saved evidence. Grouping, notes and hypotheses come in phase 3.

import { h, icon, fmtDate } from "../ui.js";
import { img } from "../media.js";

export function casebookApp(phone) {
  const g = phone.g, w = g.w;

  function item(e) {
    let title = "", sub = "", thumb = null, open = () => {};
    if (e.message) {
      const m = g.s.messages.find(x => x.id === e.message);
      title = `Message from ${phone.contactName(m?.thread)}`;
      sub = m?.text || "";
      open = () => phone.push("messages", { kind: "thread", id: m.thread });
    } else {
      const a = w.artifacts.get(e.artifact);
      const v = g.view(e.artifact, e.version || undefined);
      title = e.image ? (w.images.get(e.image)?.caption || "Image") : (v.title || a?.title || e.artifact);
      sub = e.image ? `Image from ${a?.title || ""}` : `${a?.url || w.platforms.get(a?.platform)?.name || ""}${v.cached ? " · cached copy" : ""}`;
      if (e.image) thumb = img(e.image, { cls: "thumb" });
      open = () => e.image ? phone.viewImage(e.image, { artifact: e.artifact }) : phone.openArtifact(e.artifact, v.cached ? e.version : undefined);
    }
    return h("button.ev-item", { onclick: open }, thumb || h("span.ev-ico", icon(e.message ? "chat" : "globe")),
      h("div.ev-main", h("b", title), h("div.muted.ev-sub", sub), h("div.muted.ev-day", `Saved day ${e.day}`)));
  }

  return {
    id: "casebook",
    root: () => ({ kind: "evidence" }),
    render(desc, canBack) {
      const list = [...g.s.evidence].reverse();
      return [h("div.topbar.cb-bar", phone.backButton(),
        h("div.bar-title", phone.str("apps.casebook"))),
      h("div.scroll", h("div.cb",
        h("div.section-title", `${phone.str("casebook.evidence")} (${list.length})`),
        list.length ? list.map(item) : h("div.empty", h("b", "No evidence yet."),
          h("div.muted", "Tap the bookmark on a page, or long-press a page, image or message, to save it here.")),
        h("div.composer-note.muted", "Notes and hypotheses arrive in the next update.")))];
    },
  };
}
