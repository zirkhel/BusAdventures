// @ts-check
// Messages. Phase 2: read threads and open attachments. Asking, showing evidence and
// replying come in phase 3. Screens: list · thread {id} · page {id, view}

import { h, icon, onLongPress } from "../ui.js";
import { avatar } from "../media.js";
import { renderArtifact, renderGone, linkify } from "../render.js";

export function messagesApp(phone) {
  const g = phone.g, w = g.w;

  const accountOf = id => w.characters.get(id)?.account ?? (w.accounts.has(id) ? id : null);
  const unreadIn = id => g.s.notifications.filter(n => !n.read && n.ref?.thread === id);

  function bar(title, canBack, extra) {
    return h("div.topbar.msg-bar",
      phone.backButton(),
      h("div.bar-title", title), extra || null);
  }

  function list() {
    const threads = [...new Set(g.s.messages.map(m => m.thread))];
    threads.sort((a, b) => lastIndex(b) - lastIndex(a));
    if (!threads.length) return h("div.empty", h("b", "No messages."));
    return threads.map(id => {
      const msgs = g.thread(id);
      const last = msgs[msgs.length - 1];
      const unread = unreadIn(id).length;
      return h("button.thread-row", { class: unread ? "unread" : "", onclick: () => phone.push("messages", { kind: "thread", id }) },
        avatar(w, accountOf(id), 46),
        h("div.tr-main", h("div.tr-head", h("b", phone.contactName(id)), h("span.muted", `Day ${last.day}`)),
          h("div.tr-last", last.from === "player" ? `You: ${last.text}` : last.text)),
        unread ? h("span.dot") : null);
    });
  }

  function lastIndex(id) { for (let i = g.s.messages.length - 1; i >= 0; i--) if (g.s.messages[i].thread === id) return i; return -1; }

  function thread(desc) {
    for (const n of unreadIn(desc.id)) g.dispatch({ type: "readNotification", id: n.id });
    const msgs = g.thread(desc.id);
    let day = null;
    const out = [];
    for (const m of msgs) {
      if (m.day !== day) { day = m.day; out.push(h("div.day-sep", `Day ${m.day}`)); }
      const mine = m.from === "player";
      const bubble = h("div.bubble", { class: mine ? "mine" : "theirs" }, linkify(phone, m.text),
        (m.attach || []).map(aid => attachment(aid)));
      if (!mine) onLongPress(bubble, () => phone.sheet("Message", [{ label: "Save message to Casebook", run: () => phone.saveEvidence({ message: m.id }) }]));
      out.push(bubble);
    }
    out.push(h("div.composer-note.muted", "Replying arrives in the next update."));
    const box = h("div.thread", out);
    queueMicrotask(() => { const sc = box.closest(".scroll"); if (sc) sc.scrollTop = sc.scrollHeight; });
    return box;
  }

  function attachment(aid) {
    const a = w.artifacts.get(aid);
    if (!a) return null;
    return h("button.attach", { onclick: e => { e.stopPropagation(); phone.openArtifact(aid, undefined, phone.appFor(aid) === "messages" ? "messages" : undefined); } },
      icon("paperclip"), h("span", a.title || aid));
  }

  function page(desc) {
    const v = desc.view;
    if (!v) return h("div.empty", "Nothing here.");
    if (v.error) return renderGone(phone, v, ver => phone.openArtifact(desc.id, ver, "browser"));
    return renderArtifact(phone, v);
  }

  return {
    id: "messages",
    root: () => ({ kind: "list" }),
    render(desc, canBack) {
      if (desc.kind === "thread") {
        return [bar(phone.contactName(desc.id), canBack, avatar(w, accountOf(desc.id), 30)), h("div.scroll", thread(desc))];
      }
      if (desc.kind === "page") {
        const v = desc.view;
        const ref = v && !v.error ? { artifact: desc.id, version: v.versionId } : null;
        const save = ref ? h("button.icon-btn", { "aria-label": "Save as evidence", onclick: () => phone.saveEvidence(ref) }, icon(phone.isSaved(ref) ? "bookmarked" : "bookmark")) : null;
        return [bar("Attachment", canBack, save), h("div.scroll", page(desc))];
      }
      return [bar(phone.str("apps.messages"), canBack), h("div.scroll", list())];
    },
  };
}
