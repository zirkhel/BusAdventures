// @ts-check
// Casebook: saved evidence (grouped by who it is about), theories built as
// [subject] [relation] [object] with linked evidence, and free notes.
// It shows counts and sources, never whether a theory is right.
// Screens: main {tab} · hyp {id} · builder {id?, subject?, predicate?, object?}

import { h, icon, fmtDate } from "../ui.js";
import { img, avatar } from "../media.js";

const KIND_TITLES = { person: "Person", account: "Account", org: "Organisation", place: "Place", event: "Event", project: "Project", system: "System" };
const ERRORS = {
  unknown_subject: "Pick who or what the theory is about.",
  unknown_object: "Pick the other side of the relation.",
  bad_subject: "That relation doesn't fit this subject.",
  bad_object: "That relation doesn't fit this object.",
  unknown_predicate: "Pick a relation.",
};

export function casebookApp(phone) {
  const g = phone.g, w = g.w;

  const bar = (title, extra) => h("div.topbar.cb-bar", phone.backButton(), h("div.bar-title", title), extra || null);

  // ── Evidence ────────────────────────────────────────────────────────────
  function evItem(e, opts = {}) {
    const thumb = e.image ? img(e.image, { cls: "thumb" }) : e.message ? h("span.ev-ico", icon("chat")) : h("span.ev-ico", icon("globe"));
    const a = e.artifact ? w.artifacts.get(e.artifact) : null;
    const cached = e.artifact && e.version && g.view(e.artifact, e.version).cached;
    const open = () => {
      if (e.message) { const m = g.s.messages.find(x => x.id === e.message); phone.push("messages", { kind: "thread", id: m.thread }); }
      else if (e.image) phone.viewImage(e.image, { artifact: e.artifact });
      else phone.openArtifact(e.artifact, cached ? e.version : undefined);
    };
    const sub = e.message ? "Message" : e.image ? `Image · ${a?.title || ""}` : `${a?.url || w.platforms.get(a?.platform)?.name || ""}${cached ? " · cached copy" : ""}`;
    const row = h("div.ev-item",
      h("button.ev-open", { onclick: open }, thumb,
        h("div.ev-main", h("b", phone.evidenceTitle(e)), h("div.muted.ev-sub", sub), h("div.muted.ev-day", `${phone.sourceLabel(e)} · saved day ${e.day}`))),
      opts.toggle ? opts.toggle : h("button.icon-btn.ev-more", { "aria-label": "More", onclick: () => evMenu(e) }, icon("more")));
    return row;
  }

  function evMenu(e) {
    const items = [];
    if (g.s.hypotheses.length) items.push({ label: "Link to a theory…", run: () => linkToTheory(e) });
    if (e.artifact) items.push({ label: "Show to someone…", run: () => showTo(e) });
    items.push({ label: "Remove from Casebook", danger: true, run: () => { g.dispatch({ type: "removeEvidence", id: e.id }); phone.refresh(); } });
    phone.sheet(phone.evidenceTitle(e), items);
  }

  function linkToTheory(e) {
    phone.picker({ title: "Link to theory", groups: [{ title: "", items: g.casebook().hypotheses.map(hy => ({ id: hy.id, label: hy.label, sub: hy.evidence.includes(e.id) ? "already linked" : `${hy.evidenceCount} evidence` })) }],
      onPick: id => { g.link(id, e.id, true); phone.toast("Linked."); phone.refresh(); } });
  }

  function showTo(e) {
    const people = g.contacts();
    phone.picker({ title: "Show to…", empty: "Nobody to show it to yet.",
      groups: [{ title: "", items: people.map(id => ({ id, label: phone.contactName(id), thumb: avatar(w, w.characters.get(id)?.account, 32) })) }],
      onPick: id => {
        const r = g.dispatch({ type: "message", to: id, msg: { kind: "show", artifact: e.artifact, version: e.version || undefined } });
        if (r?.error) { phone.toast(phone.str(`errors.${r.error}`)); return; }
        phone.push("messages", { kind: "thread", id, typingFrom: Math.max(0, g.thread(id).length - 1) });
      } });
  }

  function evidenceTab(desc) {
    const list = [...g.s.evidence].reverse();
    if (!list.length) return h("div.empty", h("b", "No evidence yet."), h("div.muted", "Tap the bookmark on a page, or long-press a page, image or message, to save it here."));
    const mode = desc.group ?? "about";
    const toggle = h("div.seg.small",
      h("button", { class: mode === "about" ? "on" : "", onclick: () => phone.replaceTop({ ...desc, group: "about" }) }, "By who it's about"),
      h("button", { class: mode === "all" ? "on" : "", onclick: () => phone.replaceTop({ ...desc, group: "all" }) }, "Newest first"));
    if (mode === "all") return [toggle, list.map(e => evItem(e))];
    const groups = new Map();
    for (const e of list) {
      const about = g.evidenceAbout(e.id)?.about || [];
      const keys = about.filter(id => ["person", "org", "account"].includes(g.topics().find(t => t.id === id)?.kind ?? ""));
      for (const k of keys.length ? keys : ["_other"]) { if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
    }
    const order = [...groups.keys()].sort((a, b) => (a === "_other") - (b === "_other") || groups.get(b).length - groups.get(a).length);
    const open = desc.open || {};
    return [toggle, order.map(k => {
      const t = g.topics().find(x => x.id === k);
      const isOpen = open[k] ?? false;
      return h("div.ev-group",
        h("button.ev-group-head", { onclick: () => phone.replaceTop({ ...desc, open: { ...open, [k]: !isOpen } }) },
          k === "_other" ? h("span.ev-ico.sm", icon("book")) : avatar(w, k, 32),
          h("div.pi-main", h("b", k === "_other" ? "Other" : t?.name || k), h("div.muted", k === "_other" ? "" : KIND_TITLES[t?.kind] || "")),
          h("span.count", String(groups.get(k).length)), h("span.chev", { class: isOpen ? "open" : "" }, "›")),
        isOpen ? groups.get(k).map(e => evItem(e)) : null);
    })];
  }

  // ── Theories ────────────────────────────────────────────────────────────
  function theoriesTab() {
    const hyps = g.casebook().hypotheses;
    return [h("button.new-msg", { onclick: () => phone.push("casebook", { kind: "builder" }) }, icon("plus"), "New theory"),
      hyps.length ? [...hyps].reverse().map(hy => h("button.hyp-row", { onclick: () => phone.push("casebook", { kind: "hyp", id: hy.id }) },
        h("div.hyp-label", hy.label),
        h("div.muted.hyp-counts", `${hy.evidenceCount} evidence · ${hy.sourceCount} ${hy.sourceCount === 1 ? "source" : "sources"}`, hy.note ? " · note" : ""))) :
        h("div.empty", h("b", "No theories yet."), h("div.muted", "A theory says who did what: “Brightline operates @maraquinn”. Link evidence to it and see how many independent sources you have."))];
  }

  function hypDetail(desc) {
    const hy = g.casebook().hypotheses.find(x => x.id === desc.id);
    if (!hy) return h("div.empty", "This theory was deleted.");
    const linked = hy.evidence.map(id => g.s.evidence.find(e => e.id === id)).filter(Boolean);
    const others = [...g.s.evidence].reverse().filter(e => !hy.evidence.includes(e.id));
    const sources = new Map();
    for (const e of linked) {
      const key = g.evidenceAbout(e.id)?.source ?? e.id;
      if (!sources.has(key)) sources.set(key, { label: phone.sourceLabel(e), n: 0 });
      sources.get(key).n++;
    }
    const note = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 3, placeholder: "Your reasoning, doubts, what to check next…" }));
    note.value = hy.note || "";
    note.addEventListener("change", () => { g.dispatch({ type: "updateHypothesis", id: hy.id, patch: { note: note.value } }); phone.toast("Note saved."); });
    const toggle = (e, on) => h("button.icon-btn.link-toggle", { class: on ? "on" : "", "aria-label": on ? "Unlink" : "Link",
      onclick: () => { g.link(hy.id, e.id, !on); phone.refresh(); } }, icon(on ? "check" : "plus"));
    return h("div.hyp-detail",
      h("div.hyp-big", hy.label),
      h("div.hyp-stats", h("div", h("b", String(hy.evidenceCount)), h("span", "evidence")), h("div", h("b", String(hy.sourceCount)), h("span", hy.sourceCount === 1 ? "source" : "independent sources"))),
      sources.size ? h("div.sources", [...sources.values()].map(s => h("span.chip.static", `${s.label}${s.n > 1 ? ` ×${s.n}` : ""}`))) : null,
      h("div.hint.muted", "The Casebook counts your evidence and where it comes from. It can't tell you whether you're right."),
      h("div.section-title", "Note"), h("div.pad", note),
      h("div.section-title", `Linked evidence (${linked.length})`),
      linked.length ? linked.map(e => evItem(e, { toggle: toggle(e, true) })) : h("div.empty.muted.small", "Nothing linked yet. Tap + on evidence below."),
      others.length ? [h("div.section-title", "Other evidence"), others.map(e => evItem(e, { toggle: toggle(e, false) }))] : null,
      h("div.hyp-actions",
        h("button.btn", { onclick: () => phone.push("casebook", { kind: "builder", id: hy.id, subject: hy.subject, predicate: hy.predicate, object: hy.object }) }, icon("edit"), " Edit"),
        h("button.btn.danger-btn", { onclick: () => phone.sheet("Delete this theory? Your evidence stays in the Casebook.", [
          { label: "Delete theory", danger: true, run: () => { g.dispatch({ type: "deleteHypothesis", id: hy.id }); phone.back(); } }]) }, icon("trash"), " Delete")));
  }

  function builder(desc) {
    const topics = g.topics();
    const preds = g.predicates();
    const kindOf = id => topics.find(t => t.id === id)?.kind;
    const pred = preds.find(p => p.id === desc.predicate);
    const subjKinds = new Set(preds.flatMap(p => p.subjectKinds || []));
    const set = patch => {
      const next = { ...desc, ...patch };
      let p = preds.find(x => x.id === next.predicate);
      if (p && next.subject && !(p.subjectKinds || []).includes(kindOf(next.subject))) { next.predicate = undefined; p = undefined; }
      if (!p || p.arity !== 2) next.object = undefined;
      else if (next.object && !(p.objectKinds || []).includes(kindOf(next.object))) next.object = undefined;
      phone.replaceTop(next);
    };
    const pickTopic = (title, kinds, cb) => {
      const by = new Map();
      for (const t of topics.filter(t => kinds.has(t.kind))) { if (!by.has(t.kind)) by.set(t.kind, []); by.get(t.kind).push(t); }
      phone.picker({ title, empty: "You don't know anyone or anything that fits yet.",
        groups: [...by.entries()].map(([k, items]) => ({ title: (KIND_TITLES[k] || k) + "s", items: items.sort((a, b) => a.name.localeCompare(b.name)).map(t => ({ id: t.id, label: t.name })) })),
        onPick: cb });
    };
    const slot = (label, value, onClick, disabled) => h("button.slot", { class: value ? "filled" : "", disabled: !!disabled, onclick: onClick },
      h("span.slot-label", label), h("span.slot-value", value || "Choose…"));
    const name = id => topics.find(t => t.id === id)?.name || id;
    const subjOk = desc.subject;
    const availPreds = preds.filter(p => !subjOk || (p.subjectKinds || []).includes(kindOf(desc.subject)));
    const complete = desc.subject && pred && (pred.arity === 1 || desc.object);
    const preview = complete ? g.hypothesisLabel({ subject: desc.subject, predicate: desc.predicate, object: desc.object }) : null;
    const save = () => {
      const triple = { subject: desc.subject, predicate: desc.predicate, object: pred?.arity === 2 ? desc.object : null };
      const r = desc.id ? g.dispatch({ type: "updateHypothesis", id: desc.id, patch: triple }) : g.hypothesize(triple);
      if (r.error) { phone.toast(ERRORS[r.error] || r.error); return; }
      phone.back();
      if (!desc.id) phone.push("casebook", { kind: "hyp", id: r.id });
    };
    return h("div.builder",
      h("div.hint.muted", "Build a theory from what you know: who, the relation, and who or what it points at."),
      slot("Who or what", subjOk ? name(desc.subject) : "", () => pickTopic("Who or what is it about?", subjKinds, id => set({ subject: id }))),
      slot("Relation", pred?.label || "", () => phone.picker({ title: "Relation", groups: [{ title: "", items: availPreds.map(p => ({ id: p.id, label: p.label, sub: p.template.replace("{subject}", "…").replace("{object}", "…") })) }], onPick: id => set({ predicate: id }) })),
      pred?.arity === 2 ? slot("Who or what", desc.object ? name(desc.object) : "", () => pickTopic("Pointing at…", new Set(pred.objectKinds || []), id => set({ object: id }))) : null,
      h("div.preview", { class: preview ? "" : "muted" }, preview ? `“${preview}”` : "Your theory will appear here."),
      h("button.btn.primary.wide", { disabled: !complete, onclick: save }, desc.id ? "Save changes" : "Create theory"));
  }

  // ── Notes ───────────────────────────────────────────────────────────────
  function notesTab(desc) {
    const input = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 3, placeholder: "Write a note…" }));
    const add = () => { const r = g.note(input.value); if (!r.error) phone.refresh(); };
    const notes = [...g.s.notes].reverse();
    return [h("div.pad", input, h("button.btn.primary.wide", { onclick: add }, "Add note")),
      notes.map(n => desc.editing === n.id ? editNote(desc, n) :
        h("div.note-item", h("div.note-body", n.text), h("div.note-foot.muted", `Day ${n.day}${n.edited ? " · edited" : ""}`,
          h("span.spacer"),
          h("button.icon-btn.small", { "aria-label": "Edit", onclick: () => phone.replaceTop({ ...desc, editing: n.id }) }, icon("edit")),
          h("button.icon-btn.small", { "aria-label": "Delete", onclick: () => phone.sheet("Delete note?", [{ label: "Delete", danger: true, run: () => { g.deleteNote(n.id); phone.refresh(); } }]) }, icon("trash"))))),
      !notes.length ? h("div.empty.muted", "Notes are yours alone. Nobody else reads them.") : null];
  }

  function editNote(desc, n) {
    const t = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 4 }));
    t.value = n.text;
    queueMicrotask(() => t.focus());
    return h("div.note-item.editing", t, h("div.note-foot",
      h("button.btn", { onclick: () => phone.replaceTop({ ...desc, editing: null }) }, "Cancel"),
      h("button.btn.primary", { onclick: () => { const r = g.editNote(n.id, t.value); if (!r.error) phone.replaceTop({ ...desc, editing: null }); } }, "Save")));
  }

  function main(desc) {
    const tab = desc.tab || "evidence";
    const tabs = [["evidence", `${phone.str("casebook.evidence")} (${g.s.evidence.length})`], ["theories", `Theories (${g.s.hypotheses.length})`], ["notes", `${phone.str("casebook.notes")} (${g.s.notes.length})`]];
    return [h("div.seg.tabs", tabs.map(([id, label]) => h("button", { class: tab === id ? "on" : "", onclick: () => phone.replaceTop({ ...desc, tab: id }) }, label))),
      h("div.cb", tab === "evidence" ? evidenceTab(desc) : tab === "theories" ? theoriesTab() : notesTab(desc))];
  }

  return {
    id: "casebook",
    root: () => ({ kind: "main", tab: "evidence" }),
    render(desc) {
      if (desc.kind === "hyp") return [bar("Theory"), h("div.scroll", hypDetail(desc))];
      if (desc.kind === "builder") return [bar(desc.id ? "Edit theory" : "New theory"), h("div.scroll", builder(desc))];
      const m = main(desc);
      return [bar(phone.str("apps.casebook")), m[0], h("div.scroll", m[1])];
    },
  };
}
