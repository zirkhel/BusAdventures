// @ts-check
// Casebook: saved evidence (grouped by who it is about), theories built as
// [subject] [relation] [object] with linked evidence, and free notes.
// It shows counts and sources, never whether a theory is right.
// Screens: main {tab, filter?} · hyp {id} · builder {id?, subject?, predicate?, object?}
//          event {id} · eventEdit {id?, draft}   (Timeline: the player's own reconstruction)
//          reports · report {case, channel?, hyps, events, review?} · reportDone {id, n0, e0}
// Items can belong to one, several or no cases (cases: [], unclassified by default). The filter
// (desc.filter: undefined = all, "" = unclassified, or a case id) only narrows the lists.

import { h, icon, fmtDate, fmtEventDate, TOPIC_NOTE } from "../ui.js";
import { img, avatar } from "../media.js";
import { richText } from "../render.js";

const KIND_TITLES = { person: "Person", account: "Account", org: "Organisation", place: "Place", event: "Event", project: "Project", system: "System" };
const EVENT_ERRORS = {
  empty_title: "Give the event a short title.",
  bad_date: "That date isn't complete.",
  bad_time: "That time isn't valid.",
  unknown_ref: "You can only add people and places you have looked into.",
};
const REPORT_ERRORS = {
  empty_report: "Pick at least one claim.",
  channel_unavailable: "You can't publish there.",
  unknown_case: "That case isn't open to you.",
  no_case: "Choose which case the report is about.",
};
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

  // ── Cases ───────────────────────────────────────────────────────────────
  const caseTitle = id => g.cases().find(c => c.id === id)?.title || w.mysteries.get(id)?.title || id;
  const casesLabel = item => (item.cases || []).length ? item.cases.map(caseTitle).join(", ") : "Unclassified";
  const inFilter = (item, f) => f == null ? true : f === "" ? !(item.cases || []).length : (item.cases || []).includes(f);
  const chName = id => w.channels.get(id)?.name || id;

  /** Toggle cases for an item. The sheet reopens so several can be picked. */
  function pickCases(kind, item) {
    const cur = new Set(item.cases || []);
    const save = next => { g.setCases(kind, item.id, next); phone.refresh(); };
    phone.actionSheet("Which cases is this part of?", [
      ...g.cases().map(c => ({ label: c.title, icon: cur.has(c.id) ? "check" : "plus", run: () => {
        if (cur.has(c.id)) cur.delete(c.id); else cur.add(c.id);
        save([...cur]); pickCases(kind, { ...item, cases: [...cur] });
      } })),
      { label: "Unclassified", icon: cur.size ? "plus" : "check", secondary: true, run: () => save([]) }]);
  }
  const casesRow = (kind, item) => h("button.case-row", { onclick: () => pickCases(kind, item) },
    icon("book"), h("span.muted", "Case"), h("b", casesLabel(item)), h("span.chev", "›"));

  function filterBar(desc) {
    const f = desc.filter;
    const chip = (label, val) => h("button.chip", { class: f === val ? "on" : "", onclick: () => phone.replaceTop({ ...desc, filter: val, scroll: 0 }) }, label);
    return h("div.case-filter", chip("All", undefined), g.cases().map(c => chip(c.title, c.id)), chip("Unclassified", ""));
  }

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
    items.push({ label: `Case: ${casesLabel(e)}…`, run: () => pickCases("evidence", e) });
    items.push({ label: "Add to Timeline", run: () => phone.newEvent({ title: phone.evidenceTitle(e), source: e.message ? { message: e.message } : { artifact: e.artifact, version: e.version, image: e.image }, evidence: [{ id: e.id, stance: "supports" }] }) });
    if (g.s.timeline.length) items.push({ label: "Attach to existing event…", run: () => phone.attachToEvent(e.id) });
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
    const list = [...g.s.evidence].reverse().filter(e => inFilter(e, desc.filter));
    if (!list.length && desc.filter !== undefined) return h("div.empty.muted", "Nothing here with this filter.");
    if (!list.length) return h("div.empty", h("b", "No evidence yet."), h("div.muted", "Tap the bookmark on a page, or tap an image or a word in a message and choose Save, to collect it here."));
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
  /** An example from a case the player has started; the Casebook itself knows no story. */
  const theoryExample = () => g.cases().map(c => w.mysteries.get(c.id)?.strings?.theoryExample).find(Boolean) || "Someone operates an account";

  function theoriesTab(desc) {
    const hyps = g.casebook().hypotheses.filter(hy => inFilter(hy, desc.filter));
    return [h("button.new-msg", { onclick: () => phone.push("casebook", { kind: "builder" }) }, icon("plus"), "New theory"),
      hyps.length ? [...hyps].reverse().map(hy => h("button.hyp-row", { onclick: () => phone.push("casebook", { kind: "hyp", id: hy.id }) },
        h("div.hyp-label", hy.label),
        h("div.muted.hyp-counts", `${hy.evidenceCount} evidence · ${hy.sourceCount} ${hy.sourceCount === 1 ? "source" : "sources"}`, hy.note ? " · note" : ""))) :
        h("div.empty", h("b", "No theories yet."), h("div.muted", `A theory says who did what: “${theoryExample()}”. Link evidence to it and see how many independent sources you have.`))];
  }

  function hypDetail(desc) {
    const hy = g.casebook().hypotheses.find(x => x.id === desc.id);
    if (!hy) return h("div.empty", "This theory was deleted.");
    const linked = hy.evidence.map(id => g.s.evidence.find(e => e.id === id)).filter(Boolean);
    const others = [...g.s.evidence].reverse().filter(e => !hy.evidence.includes(e.id));
    const sources = new Map();
    for (const e of linked) {
      const key = g.evidenceAbout(e.id)?.source ?? e.id;   // visible source, never the hidden one
      if (!sources.has(key)) sources.set(key, { label: phone.sourceLabel(e), n: 0 });
      sources.get(key).n++;
    }
    const note = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 3, placeholder: "Your reasoning, doubts, what to check next…" }));
    note.value = hy.note || "";
    note.addEventListener("change", () => { g.dispatch({ type: "updateHypothesis", id: hy.id, patch: { note: note.value } }); phone.toast("Note saved."); });
    const toggle = (e, on) => h("button.icon-btn.link-toggle", { class: on ? "on" : "", "aria-label": on ? "Unlink" : "Link",
      onclick: () => { g.link(hy.id, e.id, !on); phone.refresh(); } }, icon(on ? "check" : "plus"));
    return h("div.hyp-detail",
      phone.ctx.block(h("div.hyp-big", richText(phone, hy.label)), { title: "Theory" }),
      casesRow("hypothesis", hy),
      h("div.hyp-stats", h("div", h("b", String(hy.evidenceCount)), h("span", "evidence")), h("div", h("b", String(hy.sourceCount)), h("span", hy.sourceCount === 1 ? "source" : "independent sources"))),
      sources.size ? h("div.sources", [...sources.values()].map(s => h("span.chip.static", `${s.label}${s.n > 1 ? ` ×${s.n}` : ""}`))) : null,
      h("div.hint.muted", "The Casebook counts your evidence and where it comes from. It can't tell you whether you're right."),
      h("div.section-title", "Note"), h("div.pad", note),
      h("div.section-title", `Linked evidence (${linked.length})`),
      linked.length ? linked.map(e => evItem(e, { toggle: toggle(e, true) })) : h("div.empty.muted.small", "Nothing linked yet. Tap + on evidence below."),
      others.length ? [h("div.section-title", "Other evidence"), others.map(e => evItem(e, { toggle: toggle(e, false) }))] : null,
      eventsOf(hy.id),
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
      phone.picker({ title, empty: "You don't know anyone or anything that fits yet.", note: TOPIC_NOTE,
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
    const notes = [...g.s.notes].reverse().filter(n => inFilter(n, desc.filter));
    return [h("div.pad", input, h("button.btn.primary.wide", { onclick: add }, "Add note")),
      notes.map(n => desc.editing === n.id ? editNote(desc, n) :
        h("div.note-item", phone.ctx.block(h("div.note-body", richText(phone, n.text)), { title: "Note" }),
          n.from ? noteSource(n) : null,
          h("div.note-foot.muted", `Day ${n.day}${n.edited ? " · edited" : ""}${(n.cases || []).length ? ` · ${casesLabel(n)}` : ""}`,
          h("span.spacer"),
          h("button.icon-btn.small", { "aria-label": "Case", onclick: () => pickCases("note", n) }, icon("book")),
          h("button.icon-btn.small", { "aria-label": "Edit", onclick: () => phone.replaceTop({ ...desc, editing: n.id }) }, icon("edit")),
          h("button.icon-btn.small", { "aria-label": "Delete", onclick: () => phone.sheet("Delete note?", [{ label: "Delete", danger: true, run: () => { g.deleteNote(n.id); phone.refresh(); } }]) }, icon("trash"))))),
      !notes.length ? h("div.empty.muted", "Notes are yours alone. Nobody else reads them.") : null];
  }

  /** Where a saved name was found. Tapping it goes back there. */
  function noteSource(n) {
    const f = n.from;
    if (f.message) {
      const m = g.s.messages.find(x => x.id === f.message);
      return m ? h("button.note-src", { onclick: () => phone.push("messages", { kind: "thread", id: m.thread }) }, icon("chat"), `From a message by ${phone.contactName(m.thread)}`) : null;
    }
    const v = g.view(f.artifact, f.version || undefined);
    return h("button.note-src", { onclick: () => phone.openArtifact(f.artifact, v.cached ? f.version : undefined) }, icon("globe"), `From: ${v.title || w.artifacts.get(f.artifact)?.title || ""}`);
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
    const n = list => list.filter(x => inFilter(x, desc.filter)).length;
    const tabs = [["evidence", phone.str("casebook.evidence"), n(g.s.evidence)], ["theories", "Theories", n(g.s.hypotheses)],
      ["notes", phone.str("casebook.notes"), n(g.s.notes)], ["timeline", "Timeline", n(g.s.timeline)]];
    return [h("div.seg.tabs.four", tabs.map(([id, label, n]) => h("button", { class: tab === id ? "on" : "", onclick: () => phone.replaceTop({ ...desc, tab: id, scroll: 0 }) },
      h("span", label), h("small", String(n))))),
      h("div.cb", filterBar(desc), tab === "evidence" ? evidenceTab(desc) : tab === "theories" ? theoriesTab(desc) : tab === "timeline" ? timelineTab(desc) : notesTab(desc))];
  }

  // ── Timeline ────────────────────────────────────────────────────────────
  // Built only by the player. Sorted by the player's own dates; nothing is checked or corrected.

  function timelineTab(desc) {
    const list = g.timeline().filter(ev => inFilter(ev, desc.filter));
    const dated = list.filter(e => e.date.kind !== "unknown"), undated = list.filter(e => e.date.kind === "unknown");
    const row = ev => h("button.tl-row", { onclick: () => phone.push("casebook", { kind: "event", id: ev.id }) },
      h("div.tl-date", fmtEventDate(ev.date)),
      h("div.tl-dot", { class: ev.date.kind }),
      h("div.tl-main", h("b", ev.title),
        h("div.muted.tl-counts", [ev.supports ? `${ev.supports} supporting` : "", ev.contradicts ? `${ev.contradicts} contradicting` : "",
          ev.theories.length ? `${ev.theories.length} ${ev.theories.length === 1 ? "theory" : "theories"}` : ""].filter(Boolean).join(" · ") || "No evidence attached")));
    return [h("button.new-msg", { onclick: () => phone.newEvent({}) }, icon("plus"), "New event"),
      list.length ? [h("div.tl", dated.map(row)), undated.length ? [h("div.section-title", "No date"), h("div.tl.undated", undated.map(row))] : null] :
        h("div.empty", h("b", "Your timeline is empty."), h("div.muted", "Tap a date in a page or message and choose Add to Timeline, select text and choose Event, or add one from your evidence. You decide what happened and when."))];
  }

  function eventsOf(hypId) {
    const evs = g.timeline().filter(e => e.theories.includes(hypId));
    if (!evs.length) return null;
    return [h("div.section-title", `Timeline events (${evs.length})`),
      evs.map(ev => h("button.hist-row", { onclick: () => phone.push("casebook", { kind: "event", id: ev.id }) }, icon("clock"),
        h("div.pi-main", h("b", ev.title), h("div.muted", fmtEventDate(ev.date)))))];
  }

  function eventDetail(desc) {
    const ev = g.timeline().find(x => x.id === desc.id);
    if (!ev) return h("div.empty", "This event was deleted.");
    const items = stance => ev.evidence.filter(x => x.stance === stance).map(x => g.s.evidence.find(e => e.id === x.id)).filter(Boolean);
    const stanceMenu = e => h("button.icon-btn.ev-more", { "aria-label": "Change", onclick: () => phone.actionSheet(phone.evidenceTitle(e), [
      { label: "Supports the event", icon: "check", run: () => { g.linkEvent(ev.id, e.id, "supports"); phone.refresh(); } },
      { label: "Contradicts the event", icon: "close", run: () => { g.linkEvent(ev.id, e.id, "contradicts"); phone.refresh(); } },
      { label: "Detach from event", icon: "trash", run: () => { g.linkEvent(ev.id, e.id, null); phone.refresh(); } }]) }, icon("more"));
    const attach = () => {
      const free = [...g.s.evidence].reverse().filter(e => !ev.evidence.some(x => x.id === e.id));
      phone.picker({ title: "Attach evidence", empty: "Nothing else in your Casebook.",
        groups: [{ title: "", items: free.map(e => ({ id: e.id, label: phone.evidenceTitle(e), sub: phone.sourceLabel(e), thumb: e.image ? img(e.image, { cls: "thumb sm" }) : h("span.ev-ico.sm", icon(e.message ? "chat" : "globe")) })) }],
        onPick: id => phone.actionSheet("This evidence…", [
          { label: "Supports the event", icon: "check", run: () => { g.linkEvent(ev.id, id, "supports"); phone.refresh(); } },
          { label: "Contradicts the event", icon: "close", run: () => { g.linkEvent(ev.id, id, "contradicts"); phone.refresh(); } }]) });
    };
    const linkTheory = () => phone.picker({ title: "Link to theory", empty: "No theories yet.",
      groups: [{ title: "", items: g.casebook().hypotheses.map(hy => ({ id: hy.id, label: hy.label, sub: ev.theories.includes(hy.id) ? "linked · tap to unlink" : "" })) }],
      onPick: id => { g.linkEventTheory(ev.id, id, !ev.theories.includes(id)); phone.refresh(); } });
    const sup = items("supports"), con = items("contradicts");
    const hyps = g.casebook().hypotheses.filter(hy => ev.theories.includes(hy.id));
    const topics = g.topics();
    return h("div.ev-detail",
      h("div.ev-when", icon("clock"), fmtEventDate(ev.date), ev.dateSource ? h("span.muted", ` · ${ev.dateSource}`) : null),
      phone.ctx.block(h("h2.ev-title", ev.title), { title: ev.title }),
      casesRow("event", ev),
      ev.description ? phone.ctx.block(h("p.ev-desc", richText(phone, ev.description)), { title: ev.title }) : null,
      ev.about.length ? h("div.sources", ev.about.map(id => { const t = topics.find(x => x.id === id);
        return h("button.chip", { onclick: () => phone.ctx.open({ type: t?.kind === "account" ? "account" : t?.kind || "term", text: t?.name || id, id }) }, t?.name || id); })) : null,
      ev.source ? sourceLink(ev.source) : null,
      h("div.hint.muted", "Your reconstruction. Nothing here is checked against what really happened."),
      h("div.section-title", `Supporting evidence (${sup.length})`),
      sup.length ? sup.map(e => evItem(e, { toggle: stanceMenu(e) })) : null,
      h("div.section-title", `Contradicting evidence (${con.length})`),
      con.length ? con.map(e => evItem(e, { toggle: stanceMenu(e) })) : null,
      h("div.pad", h("button.btn.wide", { onclick: attach, disabled: !g.s.evidence.length }, icon("plus"), " Attach evidence")),
      h("div.section-title", `Theories (${hyps.length})`),
      hyps.map(hy => h("button.hist-row", { onclick: () => phone.push("casebook", { kind: "hyp", id: hy.id }) }, icon("book"), h("div.pi-main", h("b", hy.label)))),
      h("div.pad", h("button.btn.wide", { onclick: linkTheory, disabled: !g.s.hypotheses.length }, icon("plus"), " Link to theory")),
      ev.note ? [h("div.section-title", "Note"), phone.ctx.block(h("div.pad.note-body", richText(phone, ev.note)), { title: "Note" })] : null,
      h("div.hyp-actions",
        h("button.btn", { onclick: () => phone.push("casebook", { kind: "eventEdit", id: ev.id, draft: structuredClone({ title: ev.title, description: ev.description, note: ev.note, date: ev.date, dateSource: ev.dateSource || "", about: ev.about, evidence: ev.evidence, source: ev.source || null }) }) }, icon("edit"), " Edit"),
        h("button.btn.danger-btn", { onclick: () => phone.sheet("Delete this event? Evidence and theories stay in the Casebook.", [
          { label: "Delete event", danger: true, run: () => { g.deleteEvent(ev.id); phone.back(); } }]) }, icon("trash"), " Delete")));
  }

  function sourceLink(src) {
    if (src.message) {
      const m = g.s.messages.find(x => x.id === src.message);
      return m ? h("button.note-src", { onclick: () => phone.push("messages", { kind: "thread", id: m.thread }) }, icon("chat"), `From a message by ${phone.contactName(m.thread)}`) : null;
    }
    const v = g.view(src.artifact, src.version || undefined);
    return h("button.note-src", { onclick: () => src.image ? phone.viewImage(src.image, { artifact: src.artifact }) : phone.openArtifact(src.artifact, v.cached ? src.version : undefined) },
      icon(src.image ? "image" : "globe"), `From: ${src.image ? (w.images.get(src.image)?.caption || "image") : v.title || w.artifacts.get(src.artifact)?.title || ""}`);
  }

  /** Create or edit an event. The draft lives on the screen, so it survives switching apps. */
  function eventEditor(desc) {
    const d = desc.draft;
    const sync = () => phone.refresh();
    const title = /** @type {HTMLInputElement} */ (h("input.text-input", { type: "text", placeholder: "What happened?", maxlength: 140, value: d.title || "" }));
    title.addEventListener("input", () => { d.title = title.value; });
    const descr = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 3, placeholder: "Details (optional)" }));
    descr.value = d.description || ""; descr.addEventListener("input", () => { d.description = descr.value; });
    const note = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 2, placeholder: "Your note (optional)" }));
    note.value = d.note || ""; note.addEventListener("input", () => { d.note = note.value; });

    const kinds = [["exact", "Exact"], ["approx", "About"], ["range", "Between"], ["unknown", "Unknown"]];
    const setKind = k => {
      const cur = d.date || { kind: "unknown" };
      const day = cur.value?.length === 10 ? cur.value : cur.from || (cur.value ? (cur.value + "-01-01").slice(0, 10) : "");
      d.date = k === "exact" ? { kind: "exact", value: day } : k === "approx" ? { kind: "approx", value: (cur.value || cur.from || "").slice(0, 7) || String(g.date).slice(0, 4) }
        : k === "range" ? { kind: "range", from: day, to: cur.to || day } : { kind: "unknown" };
      sync();
    };
    const dateIn = (val, on) => { const i = /** @type {HTMLInputElement} */ (h("input.text-input.date-input", { type: "date", value: val || "" })); i.addEventListener("change", () => on(i.value)); return i; };
    const k = d.date?.kind || "unknown";
    let fields = null;
    if (k === "exact") {
      const time = /** @type {HTMLInputElement} */ (h("input.text-input.time-input", { type: "time", value: d.date.time || "" }));
      time.addEventListener("change", () => { d.date.time = time.value || undefined; });
      fields = h("div.date-row", dateIn(d.date.value, v => { d.date.value = v; d.guessedYear = false; }), time);
    } else if (k === "approx") {
      const [y, m] = String(d.date.value || "").split("-");
      const year = /** @type {HTMLInputElement} */ (h("input.text-input.year-input", { type: "number", inputmode: "numeric", min: 1900, max: 2100, placeholder: "Year", value: y || "" }));
      const month = /** @type {HTMLSelectElement} */ (h("select.text-input", h("option", { value: "" }, "Any month"),
        ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((n, i) => h("option", { value: String(i + 1).padStart(2, "0") }, n))));
      month.value = m || "";
      const upd = () => { d.date.value = year.value ? `${year.value}${month.value ? "-" + month.value : ""}` : ""; };
      year.addEventListener("input", upd); month.addEventListener("change", upd);
      fields = h("div.date-row", month, year);
    } else if (k === "range") {
      fields = h("div.date-row", dateIn(d.date.from, v => { d.date.from = v; }), h("span.muted", "to"), dateIn(d.date.to, v => { d.date.to = v; }));
    }
    const cands = d.source ? g.dateCandidates(d.source) : [];
    const topics = g.topics();
    const addAbout = () => {
      const by = new Map();
      for (const t of topics.filter(t => !d.about.includes(t.id))) { if (!by.has(t.kind)) by.set(t.kind, []); by.get(t.kind).push(t); }
      phone.picker({ title: "Who or what was involved?", empty: "Look into people, organisations or places first.",
        groups: [...by.entries()].map(([kd, items]) => ({ title: (KIND_TITLES[kd] || kd) + "s", items: items.sort((a, b) => a.name.localeCompare(b.name)).map(t => ({ id: t.id, label: t.name })) })),
        onPick: id => { d.about = [...d.about, id]; sync(); } });
    };
    const save = () => {
      const input = { title: d.title, description: d.description, note: d.note, date: d.date, dateSource: d.dateSource, about: d.about, source: d.source || undefined, evidence: d.evidence };
      const r = desc.id ? g.editEvent(desc.id, input) : g.addEvent(input);
      if (r.error) { phone.toast(EVENT_ERRORS[r.error] || r.error); return; }
      const ret = phone.top?.returnTo;
      phone.back();
      if (desc.id) return;
      if (ret) phone.toast("Added to your Timeline.");
      else phone.push("casebook", { kind: "event", id: r.id });
    };
    return h("div.builder.ev-edit",
      h("label.field-label", "What happened"), title,
      h("label.field-label", "When"),
      h("div.seg.small", kinds.map(([id, label]) => h("button", { class: k === id ? "on" : "", onclick: () => setKind(id) }, label))),
      fields,
      d.guessedYear ? h("div.hint.muted", "The text gave no year. Check it.") : null,
      cands.length ? [h("div.field-label.sub", "Dates on the source. You decide which one is the event."),
        h("div.sources", cands.map(c => h("button.chip", { class: JSON.stringify(c.date) === JSON.stringify(d.date) ? "on" : "",
          onclick: () => { d.date = structuredClone(c.date); d.dateSource = c.from; d.guessedYear = !!c.guessedYear; sync(); } }, c.label, ": ", fmtEventDate(c.date))))] : null,
      h("label.field-label", "Details"), descr,
      h("label.field-label", "Who or what"),
      h("div.sources", d.about.map(id => h("button.chip.removable", { onclick: () => { d.about = d.about.filter(x => x !== id); sync(); } }, topics.find(t => t.id === id)?.name || id, " ×")),
        h("button.chip", { onclick: addAbout }, "+ Add")),
      d.evidence?.length ? [h("label.field-label", "Evidence"), h("div.sources", d.evidence.map(x => { const e = g.s.evidence.find(y => y.id === x.id);
        return e ? h("button.chip.removable", { onclick: () => { d.evidence = d.evidence.filter(y => y.id !== x.id); sync(); } }, `${x.stance === "supports" ? "Supports" : "Contradicts"}: ${phone.evidenceTitle(e)} ×`) : null; }))] : null,
      d.source ? sourceLink(d.source) : null,
      h("label.field-label", "Note"), note,
      h("button.btn.primary.wide", { onclick: save }, desc.id ? "Save changes" : "Add to Timeline"));
  }

  // ── Reports ─────────────────────────────────────────────────────────────
  // A report is about one case. What happens after is up to the world: reactions arrive as
  // messages and notifications, and endings show their epilogue here.

  // Endings are developments in the case, not a "game over": each shows the day it happened.
  const epilogue = e => h("div.epilogue", h("div.muted.small", e.day ? `Day ${e.day}` : ""), h("b", e.title || "A development"), e.epilogue ? h("p", e.epilogue) : null);

  function reportsScreen() {
    const ends = g.endings(), reps = g.casebook().reports;
    return [
      g.cases().map(c => {
        const st = g.caseStatus(c.id);
        const dev = ends.filter(e => e.case === c.id);
        return h("div.case-card",
          h("div.case-head", h("b", c.title), h("span.case-st", { class: st }, st === "closed" ? "Resolved" : "Open")),
          dev.length ? h("div.dev-head.muted.small", "How the case developed") : null,
          dev.map(epilogue),
          dev.length ? h("div.hint.muted", "This is where the case stands now, not the end of it. The world goes on, and you can keep investigating.") : null,
          h("button.btn.primary.wide", { onclick: () => phone.push("casebook", { kind: "report", case: c.id, hyps: [], events: [] }) }, icon("plus"), " New report"));
      }),
      h("div.section-title", `Published reports (${reps.length})`),
      reps.length ? [...reps].reverse().map(r => h("div.rep-row",
        h("div.muted.small", `Day ${r.day} · ${chName(r.channel)} · ${caseTitle(r.case)}`),
        r.items.map(i => h("div.rep-item", `“${i.label}”`)),
        r.events.length ? h("div.muted.small", `${r.events.length} timeline ${r.events.length === 1 ? "event" : "events"}`) : null,
        r.cut.length ? h("div.muted.small", `Cut before publishing: ${r.cut.join("; ")}`) : null)) :
        h("div.empty.muted", "Nothing published yet. A report goes out under your name, and people will react to it.")];
  }

  function reportBuilder(desc) {
    const cid = desc.case;
    const chans = g.channels(cid);
    const ch = chans.find(c => c.id === desc.channel);
    const set = patch => phone.replaceTop({ ...desc, review: null, ...patch });
    // Grouped by the player's own classification. Every item can be picked, classified or not.
    const group = items => [[`In ${caseTitle(cid)}`, items.filter(x => (x.cases || []).includes(cid))], ["Unclassified", items.filter(x => !(x.cases || []).length)],
      ["Other cases", items.filter(x => (x.cases || []).length && !x.cases.includes(cid))]].filter(([, l]) => l.length);
    const row = (on, label, sub, toggle) => h("button.check-row", { class: on ? "on" : "", onclick: toggle },
      h("span.box", on ? icon("check") : null), h("div.pi-main", h("b", label), sub ? h("div.muted", sub) : null));
    const tog = (key, id) => set({ [key]: desc[key].includes(id) ? desc[key].filter(x => x !== id) : [...desc[key], id] });
    const hyps = g.casebook().hypotheses, evs = g.timeline();
    const reviewer = ch?.reviewer ? phone.contactName(ch.reviewer) : null;
    const ready = !!ch && desc.hyps.length > 0;
    const ask = () => { const r = g.review(ch.id, desc.hyps, { case: cid }); phone.replaceTop({ ...desc, review: r.lines || [] }); };
    const publish = () => phone.sheet(`Publish ${desc.hyps.length} ${desc.hyps.length === 1 ? "claim" : "claims"} through ${ch.name}? You can't take it back.`, [{ label: "Publish", run: () => {
      const n0 = g.s.notifications.length, e0 = g.s.endings.length;
      const r = g.publish(ch.id, desc.hyps, { case: cid, events: desc.events });
      if (r.error) { phone.toast(REPORT_ERRORS[r.error] || r.error); return; }
      if (r.refused) { phone.replaceTop({ ...desc, review: r.lines }); phone.toast("Nothing was published."); return; }
      phone.replaceTop({ kind: "reportDone", id: r.report.id, n0, e0 });
    } }]);
    return h("div.builder.report",
      h("div.hint.muted", `A report about ${caseTitle(cid)}. It goes out under your name.`),
      h("label.field-label", "Where"),
      h("div.sources", chans.map(c => h("button.chip", { class: c.id === desc.channel ? "on" : "", onclick: () => set({ channel: c.id }) }, c.name))),
      h("label.field-label", `Claims (${desc.hyps.length})`),
      hyps.length ? group(hyps).map(([t, l]) => [h("div.field-label.sub", t), l.map(hy => row(desc.hyps.includes(hy.id), hy.label,
        `${hy.evidenceCount} evidence · ${hy.sourceCount} ${hy.sourceCount === 1 ? "source" : "sources"}`, () => tog("hyps", hy.id)))]) :
        h("div.muted.small", "Build a theory first. Each theory you pick becomes a claim."),
      h("label.field-label", `Timeline events (${desc.events.length})`),
      evs.length ? group(evs).map(([t, l]) => [h("div.field-label.sub", t), l.map(ev => row(desc.events.includes(ev.id), ev.title, fmtEventDate(ev.date), () => tog("events", ev.id)))]) :
        h("div.muted.small", "Optional. Events you pick go in as you wrote them."),
      desc.review ? h("div.review", h("div.review-who", `${reviewer || "Review"}:`), desc.review.map(l => h("p", l.text))) : null,
      reviewer ? h("button.btn.wide", { disabled: !ready, onclick: ask }, icon("chat"), ` Ask ${reviewer} first`) : null,
      h("button.btn.primary.wide", { disabled: !ready, onclick: publish }, "Publish"));
  }

  function reportDone(desc) {
    const r = g.casebook().reports.find(x => x.id === desc.id);
    if (!r) return h("div.empty", "Report not found.");
    const reactions = g.s.notifications.slice(desc.n0 ?? g.s.notifications.length);
    const ends = g.endings().slice(desc.e0 ?? g.s.endings.length);
    return h("div.report-done",
      h("div.hint", `Published through ${chName(r.channel)} on day ${r.day}.`),
      h("div.section-title", "Claims"), r.items.map(i => h("div.rep-item.pad", `“${i.label}”`)),
      r.cut.length ? [h("div.section-title", "Cut before publishing"), r.cut.map(l => h("div.rep-item.pad.muted", `“${l}”`))] : null,
      r.events.length ? [h("div.section-title", "Timeline events"), r.events.map(e => h("div.rep-item.pad", `${fmtEventDate(e.date)} · ${e.title}`))] : null,
      h("div.section-title", "Reactions"),
      reactions.length ? reactions.map(n => h("div.reaction", n.text)) : h("div.muted.pad", "Nothing yet. Reactions can take a day."),
      ends.map(epilogue),
      h("div.pad", h("button.btn.wide", { onclick: () => phone.back() }, "Done")));
  }

  return {
    id: "casebook",
    root: () => ({ kind: "main", tab: "evidence" }),
    render(desc) {
      if (desc.kind === "hyp") return [bar("Theory"), h("div.scroll", hypDetail(desc))];
      if (desc.kind === "builder") return [bar(desc.id ? "Edit theory" : "New theory"), h("div.scroll", builder(desc))];
      if (desc.kind === "event") return [bar("Event"), h("div.scroll", eventDetail(desc))];
      if (desc.kind === "eventEdit") return [bar(desc.id ? "Edit event" : "New event"), h("div.scroll", eventEditor(desc))];
      if (desc.kind === "reports") return [bar("Reports"), h("div.scroll", reportsScreen())];
      if (desc.kind === "report") return [bar("New report"), h("div.scroll", reportBuilder(desc))];
      if (desc.kind === "reportDone") return [bar("Published"), h("div.scroll", reportDone(desc))];
      const m = main(desc);
      return [bar(phone.str("apps.casebook"), h("button.bar-link", { onclick: () => phone.push("casebook", { kind: "reports" }) }, "Reports")), m[0], h("div.scroll", m[1])];
    },
  };
}
