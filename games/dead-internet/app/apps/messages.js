// @ts-check
// Messages. The player never types free text: they ask about something they know, show a piece
// of evidence from the Casebook, or pick one of the reply options a person offers. What people
// answer is decided by the world data (knowledge, trust, flags), not by this file.
// Screens: list · thread {id} · page {id, view}

import { h, icon, TOPIC_NOTE } from "../ui.js";
import { avatar, img } from "../media.js";
import { renderArtifact, renderGone, richText } from "../render.js";

const KIND_TITLES = { person: "People", account: "Accounts", org: "Organisations", place: "Places", event: "Events", project: "Projects", system: "Other" };
const KIND_ORDER = ["person", "account", "org", "event", "place", "project", "system"];

export function messagesApp(phone) {
  const g = phone.g, w = g.w;

  const accountOf = id => w.characters.get(id)?.account ?? (w.accounts.has(id) ? id : null);
  const unreadIn = id => g.s.notifications.filter(n => !n.read && n.ref?.thread === id);
  const isCharacter = id => w.characters.has(id);

  function contactAvatar(id, size) {
    const acc = accountOf(id), image = w.accounts.get(acc)?.avatar;
    const picture = avatar(w, acc, size);
    if (!image) return picture;
    return h("button.avatar-open.msg-avatar", {
      "aria-label": `View profile picture: ${phone.contactName(id)}`,
      onclick: () => phone.viewImage(image),
    }, picture);
  }

  function bar(title, extra, onTitle) {
    return h("div.topbar.msg-bar", phone.backButton(),
      onTitle ? h("button.bar-title", { onclick: onTitle }, title) : h("div.bar-title", title), extra || null);
  }

  // ── Thread list ─────────────────────────────────────────────────────────
  function list() {
    const threads = [...new Set(g.s.messages.map(m => m.thread))];
    threads.sort((a, b) => lastIndex(b) - lastIndex(a));
    const rows = threads.map(id => {
      const msgs = g.thread(id);
      const last = msgs[msgs.length - 1];
      const unread = unreadIn(id).length;
      return h("div.thread-row", { class: unread ? "unread" : "" },
        contactAvatar(id, 46),
        h("button.tr-open", { onclick: () => phone.push("messages", { kind: "thread", id }) },
        h("div.tr-main", h("div.tr-head", h("b", phone.contactName(id)), h("span.muted", `Day ${last.day}`)),
          h("div.tr-last", last.from === "player" ? `You: ${last.text}` : last.text)),
        unread ? h("span.dot") : null));
    });
    return [h("button.new-msg", { onclick: newMessage }, icon("edit"), "New message"),
      rows.length ? rows : h("div.empty", h("b", "No messages."))];
  }

  function newMessage() {
    const people = g.contacts().filter(id => !g.s.messages.some(m => m.thread === id));
    phone.picker({
      title: "New message",
      empty: "Nobody new to write to. Find people's profiles first.",
      groups: [{ title: "", items: people.map(id => ({ id, label: phone.contactName(id), sub: w.accounts.get(accountOf(id))?.handle || "", thumb: avatar(w, accountOf(id), 36) })) }],
      onPick: id => phone.push("messages", { kind: "thread", id }),
    });
  }

  function lastIndex(id) { for (let i = g.s.messages.length - 1; i >= 0; i--) if (g.s.messages[i].thread === id) return i; return -1; }

  // ── A conversation ──────────────────────────────────────────────────────
  function thread(desc) {
    for (const n of unreadIn(desc.id)) g.dispatch({ type: "readNotification", id: n.id });
    const msgs = g.thread(desc.id);
    let day = null;
    const out = [];
    const typingFrom = desc.typingFrom ?? Infinity;
    msgs.forEach((m, i) => {
      if (m.day !== day) { day = m.day; out.push(h("div.day-sep", `Day ${m.day}`)); }
      const mine = m.from === "player";
      // Tap a word for its actions; select text to search it. Their messages can be saved from either menu.
      const bubble = phone.ctx.block(h("div.bubble", { class: mine ? "mine" : "theirs" }, richText(phone, m.text),
        (m.attach || []).map(aid => attachment(aid))), mine ? { title: "Your message" } : { message: m.id, title: `Message from ${phone.contactName(m.thread)}` });
      if (!mine && phone.isSaved({ message: m.id })) bubble.classList.add("saved");
      if (!mine && i >= typingFrom) {
        // Replies appear after a short "typing" pause, one after another.
        const delay = 650 + (i - typingFrom) * 900;
        const dots = h("div.bubble.theirs.typing", h("span"), h("span"), h("span"));
        bubble.hidden = true;
        out.push(dots, bubble);
        setTimeout(() => { dots.remove(); bubble.hidden = false; scrollDown(box); }, delay);
      } else out.push(bubble);
    });
    if (!msgs.length) out.push(h("div.empty.muted", `Start the conversation with ${phone.contactName(desc.id)}.`));
    delete desc.typingFrom;
    const box = h("div.thread", out);
    queueMicrotask(() => scrollDown(box));
    return box;
  }

  function scrollDown(box) { const sc = box.closest(".scroll"); if (sc) sc.scrollTop = sc.scrollHeight; }

  function attachment(aid) {
    const a = w.artifacts.get(aid);
    if (!a) return null;
    return h("button.attach", { onclick: e => { e.stopPropagation(); phone.ctx.open({ type: "document", text: a.title || aid, artifact: aid }); } },
      icon("paperclip"), h("span", a.title || aid));
  }

  /** Send, then re-render with the reply "typing". */
  function send(desc, action) {
    const before = g.s.messages.length;
    const r = g.dispatch({ type: "message", to: desc.id, msg: action });
    if (r?.error) { phone.toast(phone.str(`errors.${r.error}`)); return; }
    const firstReply = g.s.messages.findIndex((m, i) => i >= before && m.thread === desc.id && m.from !== "player");
    const threadIdx = firstReply < 0 ? Infinity : g.thread(desc.id).indexOf(g.s.messages[firstReply]);
    phone.replaceTop({ ...desc, typingFrom: threadIdx });
  }

  function askTopic(desc) {
    const topics = g.topics().filter(t => t.id !== desc.id && t.id !== w.characters.get(desc.id)?.account);
    const byKind = new Map();
    for (const t of topics) { if (!byKind.has(t.kind)) byKind.set(t.kind, []); byKind.get(t.kind).push(t); }
    const asked = new Set(g.thread(desc.id).filter(m => m.from === "player" && m.kind === "ask").map(m => m.topic));
    phone.picker({
      title: `Ask ${phone.contactName(desc.id)} about…`, note: TOPIC_NOTE,
      groups: KIND_ORDER.filter(k => byKind.has(k)).map(k => ({ title: KIND_TITLES[k] || k,
        items: byKind.get(k).sort((a, b) => a.name.localeCompare(b.name)).map(t => ({ id: t.id, label: t.name, sub: asked.has(t.id) ? "asked before" : "" })) })),
      onPick: topic => send(desc, { kind: "ask", topic }),
    });
  }

  function showEvidence(desc) {
    const items = [...g.s.evidence].reverse().filter(e => e.artifact);
    phone.picker({
      title: `Show ${phone.contactName(desc.id)}…`,
      empty: "Your Casebook is empty. Save pages, posts or images first.",
      groups: [{ title: "From your Casebook", items: items.map(e => ({ id: e.id, label: phone.evidenceTitle(e), sub: phone.sourceLabel(e),
        thumb: e.image ? img(e.image, { cls: "thumb sm" }) : h("span.ev-ico.sm", icon("globe")) })) }],
      onPick: id => { const e = g.s.evidence.find(x => x.id === id); send(desc, { kind: "show", artifact: e.artifact, version: e.version || undefined }); },
    });
  }

  function composer(desc) {
    if (!isCharacter(desc.id)) return h("div.composer.muted.center", "You can't reply to this sender.");
    if (!g.canContact(desc.id)) return h("div.composer.muted.center", "You can't message this person right now.");
    const prompts = g.prompts(desc.id);
    return h("div.composer",
      prompts.length ? h("div.prompts", prompts.map(p => h("button.prompt", { onclick: () => send(desc, { kind: "reply", option: p.id }) }, p.label))) : null,
      h("div.composer-row",
        h("button.cmp-btn", { onclick: () => askTopic(desc) }, icon("chat"), "Ask about…"),
        h("button.cmp-btn", { onclick: () => showEvidence(desc) }, icon("paperclip"), "Show evidence…")));
  }

  function page(desc) {
    const v = desc.view;
    if (!v) return h("div.empty", "Nothing here.");
    if (v.error) return renderGone(phone, v, ver => phone.openArtifact(desc.id, ver, "browser"), phone.archiveOpener(desc.id));
    return renderArtifact(phone, v);
  }

  return {
    id: "messages",
    root: () => ({ kind: "list" }),
    render(desc) {
      if (desc.kind === "thread") {
        const acc = accountOf(desc.id);
        return [bar(phone.contactName(desc.id), contactAvatar(desc.id, 30), acc ? () => phone.openAccount(acc) : null),
          h("div.scroll", thread(desc)), composer(desc)];
      }
      if (desc.kind === "page") {
        const v = desc.view;
        const ref = v && !v.error ? { artifact: desc.id, version: v.versionId } : null;
        const save = ref ? h("button.icon-btn", { "aria-label": "Save as evidence", onclick: () => phone.saveEvidence(ref) }, icon(phone.isSaved(ref) ? "bookmarked" : "bookmark")) : null;
        return [bar("Attachment", save), h("div.scroll", page(desc))];
      }
      return [bar(phone.str("apps.messages")), h("button.btn", { onclick: () => phone.push("connect", { kind: "home", tab: "friends" }) }, "Friends"), h("div.scroll", list())];
    },
  };
}
