// @ts-check
// Casebook: saved evidence (grouped by who it is about), theories in the player's own words
// (optionally with a structured [subject] [relation] [object] claim for publishing) with
// evidence for and against, a status with history and alternatives, free notes and open questions.
// It shows counts and sources, never whether a theory is right.
// Screens: main {tab, filter?, select?} · hyp {id} · builder {id?, title?, subject?, predicate?, object?, alternativeOf?, evidence?}
//          question {id}   (open questions live in Notes)
//          compare {items, show?, zoom?} · link {a, b, id?, pick?, note?, swap?}   (comparison and the player's links)
//          event {id} · eventEdit {id?, draft}   (Timeline: the player's own reconstruction)
//          reports · report {case, channel?, hyps, events, review?} · reportDone {id, n0, e0}
// Items can belong to one, several or no cases (cases: [], unclassified by default). The filter
// (desc.filter: undefined = all, "" = unclassified, or a case id) only narrows the lists.

import { h, icon, fmtDate, fmtEventDate, TOPIC_NOTE, onLongPress } from "../ui.js";
import { img, avatar, imageUrl } from "../media.js";
import { imageInfoRows } from "../phone.js";
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
  empty_theory: "Write the theory in your own words, or build a claim.",
};
/** The player's own status for a theory. Neutral words: none of them says the theory is right. */
const STATUS = { open: "Working theory", convinced: "Convinced", rejected: "Rejected" };
const Q_STATUS = { open: "Open", answered: "Answered", dropped: "Set aside" };
const LINK_KINDS = { evidence: "Evidence", topics: "Person or thing", sources: "Source", theories: "Theory" };
/** How the player says pieces of evidence relate. Their claim, never checked. */
const CONNECTIONS = { supports: "Supports", contradicts: "Contradicts", related: "Related", same_origin: "Same origin", manipulated: "Possibly manipulated", unrelated: "Unrelated" };
const LETTERS = "ABCDEFGH";

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
    const open = () => { g.editEvidence(e.id, { opened: true }); phone.push("casebook", { kind: "evidence", id: e.id }); };
    const sub = [e.quote ? "Excerpt" : e.message ? "Message" : e.image ? "Image" : "Saved page",
      e.marks.reviewed ? "Reviewed" : "Not reviewed", e.marks.important ? "Important" : "", e.marks.doubtful ? "Doubtful" : "",
      e.shelf ? `Set aside: ${e.shelf}` : ""].filter(Boolean).join(" · ");
    const selecting = opts.selected != null;
    const btn = h("button.ev-open", { onclick: selecting ? opts.onToggle : open, ...(selecting ? { "aria-pressed": String(opts.selected) } : {}) }, thumb,
        h("div.ev-main", h("b", phone.evidenceTitle(e)), h("div.muted.ev-sub", sub), h("div.muted.ev-day", `${phone.sourceLabel(e)} · saved day ${e.day}`)));
    // Long press starts selection mode (to compare, link or set aside several at once).
    if (opts.onLongPress) onLongPress(btn, opts.onLongPress);
    const row = h("div.ev-item", { class: selecting && opts.selected ? "selected" : "" }, btn,
      selecting ? h("span.sel-box", { "aria-hidden": "true" }, opts.selected ? icon("check") : null)
        : opts.toggle ? opts.toggle : h("button.icon-btn.ev-more", { "aria-label": "More", onclick: () => evMenu(e) }, icon("more")));
    return row;
  }

  function triageFilters(desc) {
    const select = (label, values, current, change) => {
      const el = h("select.text-input", { "aria-label": label }, values.map(([value, text]) => h("option", { value }, text)));
      el.value = current;
      el.addEventListener("change", () => change(el.value));
      return el;
    };
    return h("div.evidence-filters",
      select("Evidence filter", [["active", "Active"], ["unreviewed", "Not reviewed"], ["important", "Important"], ["doubtful", "Doubtful"], ["shelved", "Set aside"]], desc.triage || "active",
        triage => phone.replaceTop({ ...desc, triage, scroll: 0 })),
      select("Case filter", [["*", "All cases"], ...g.cases().map(c => [c.id, c.title]), ["", "Unclassified"]], desc.filter ?? "*",
        filter => phone.replaceTop({ ...desc, filter: filter === "*" ? undefined : filter, scroll: 0 })));
  }

  function shelve(e) {
    phone.actionSheet("Set aside — your reason", [
      { label: "Irrelevant", run: () => { g.editEvidence(e.id, { shelf: "irrelevant" }); phone.refresh(); } },
      { label: "Finished with it", run: () => { g.editEvidence(e.id, { shelf: "finished" }); phone.refresh(); } },
    ]);
  }

  /**
   * Pick a piece of evidence with search: important first, then the rest that is not set aside,
   * then what is set aside. Search matches the title, the visible source, the comment and the excerpt.
   */
  function pickEvidence(title, exclude, onPick) {
    const item = e => ({ id: e.id, label: phone.evidenceTitle(e), sub: `${phone.sourceLabel(e)} · day ${e.day}${e.marks.important ? " · Important" : ""}`,
      keywords: `${e.note || ""} ${e.quote?.text || ""}`, thumb: e.image ? img(e.image, { cls: "thumb sm" }) : h("span.ev-ico.sm", icon(e.message ? "chat" : "globe")) });
    const free = [...g.s.evidence].reverse().filter(e => !exclude.includes(e.id));
    phone.picker({ title, search: true, searchLabel: "Search evidence", empty: free.length ? "No evidence matches." : "Nothing else in your Casebook.",
      groups: [{ title: "Important", items: free.filter(e => !e.shelf && e.marks.important).map(item) },
        { title: "Evidence", items: free.filter(e => !e.shelf && !e.marks.important).map(item) },
        { title: "Set aside", items: free.filter(e => e.shelf).map(item) }],
      onPick });
  }

  function evidenceDetail(desc) {
    const e = g.s.evidence.find(x => x.id === desc.id);
    if (!e) return h("div.empty", "This evidence was removed.");
    const view = e.artifact ? g.evidenceView(e.id) : null;
    const message = e.message ? g.s.messages.find(m => m.id === e.message) : null;
    const origin = e.message ? { message: e.message } : { artifact: e.artifact, version: e.version };
    const update = patch => { g.editEvidence(e.id, patch); phone.refresh(); };
    const mark = (key, label) => h("button.chip", { "aria-pressed": String(!!e.marks[key]), onclick: () => update({ [key]: !e.marks[key] }) }, `${e.marks[key] ? "✓ " : ""}${label}`);
    const note = h("textarea.note-input", { rows: 3, "aria-label": "My comment", placeholder: "Your comment (optional)" });
    note.value = e.note;
    // Persist on input so navigation cannot silently lose a comment.
    note.addEventListener("input", () => g.editEvidence(e.id, { note: note.value }));
    const openCopy = () => {
      if (e.image) return phone.viewImage(e.image, origin);
      if (e.message) return phone.push("messages", { kind: "thread", id: message.thread });
      phone.push("browser", { kind: "page", id: e.artifact, version: e.version, view: { ...view, saved: true, cached: false }, url: view.url || "" });
    };
    const theories = g.casebook().hypotheses.filter(hy => hy.evidence.includes(e.id) || hy.against.includes(e.id));
    const questions = g.casebook().questions.filter(q => q.links.evidence.includes(e.id));
    const links = g.casebook().links.filter(l => l.a === e.id || l.b === e.id);
    const events = g.timeline().filter(ev => ev.evidence.some(x => x.id === e.id));
    return h("div.evidence-detail.pad",
      h("h2", phone.evidenceTitle(e)),
      h("div.muted", `${phone.sourceLabel(e)} · saved day ${e.day}${view?.date ? ` · ${fmtDate(view.date)}` : ""}`),
      e.quote ? phone.ctx.block(h("blockquote", e.quote.text), origin) : null,
      e.image ? img(e.image, { cls: "evidence-preview" }) : message ? phone.ctx.block(h("p", message.text), origin) : null,
      h("button.btn.wide", { onclick: openCopy, disabled: !!view?.error }, e.message ? "Open original message" : e.image ? "Open image" : "Open saved copy"),
      e.artifact ? h("button.btn.wide", { onclick: () => phone.openArtifact(e.artifact, undefined, phone.appFor(e.artifact) === "casebook" ? "browser" : undefined) }, "Open original source") : null,
      h("div.field-label", "My marks"), h("div.evidence-marks", mark("reviewed", "Reviewed"), mark("important", "Important"), mark("doubtful", "Doubtful")),
      h("label.field-label", "My comment"), note,
      casesRow("evidence", e),
      theories.length ? h("div.section-title", "Linked theories") : null,
      theories.map(hy => h("button.hist-row", { onclick: () => phone.push("casebook", { kind: "hyp", id: hy.id }) },
        h("span.stance", hy.against.includes(e.id) ? "Against" : "For"), h("div.pi-main", h("b", hy.label)))),
      questions.length ? h("div.section-title", "Questions") : null,
      questions.map(q => questionRow(q)),
      h("div.section-title", `Connections (${links.length})`),
      links.map(l => linkRow(l, e.id)),
      h("button.btn.wide", { onclick: () => compareWith(e), disabled: g.s.evidence.length < 2 }, "Compare with…"),
      events.length ? h("div.section-title", "Timeline") : null,
      events.map(ev => h("button.hist-row", { onclick: () => phone.push("casebook", { kind: "event", id: ev.id }) }, ev.title)),
      e.shelf ? h("p.muted", `Set aside: ${e.shelf === "finished" ? "finished with it" : "irrelevant"} · day ${e.shelvedDay}`) : null,
      h("button.btn.wide", { onclick: () => e.shelf ? update({ shelf: null }) : shelve(e) }, e.shelf ? "Restore evidence" : "Set aside…"),
      h("button.btn.wide", { onclick: () => evMenu(e) }, "More actions…"));
  }

  function evMenu(e) {
    const update = patch => { g.editEvidence(e.id, patch); phone.refresh(); };
    const items = [
      { label: e.marks.reviewed ? "Mark not reviewed" : "Mark reviewed", run: () => update({ reviewed: !e.marks.reviewed }) },
      { label: e.marks.important ? "Unmark important" : "Mark important", run: () => update({ important: !e.marks.important }) },
      { label: e.marks.doubtful ? "Unmark doubtful" : "Mark doubtful", run: () => update({ doubtful: !e.marks.doubtful }) },
      { label: "Comment…", run: () => { g.editEvidence(e.id, { opened: true }); phone.push("casebook", { kind: "evidence", id: e.id }); } },
      { label: e.shelf ? "Restore evidence" : "Set aside…", run: () => e.shelf ? update({ shelf: null }) : shelve(e) },
    ];
    if (g.s.hypotheses.length) items.push({ label: "Link to a theory…", run: () => linkToTheory(e) });
    if (g.s.evidence.length > 1) items.push({ label: "Compare with…", run: () => compareWith(e) });
    if (e.artifact) items.push({ label: "Show to someone…", run: () => showTo(e) });
    items.push({ label: `Case: ${casesLabel(e)}…`, run: () => pickCases("evidence", e) });
    items.push({ label: "Add to Timeline", run: () => phone.newEvent({ title: phone.evidenceTitle(e), source: e.message ? { message: e.message } : { artifact: e.artifact, version: e.version, image: e.image }, evidence: [{ id: e.id, stance: "supports" }] }) });
    if (g.s.timeline.length) items.push({ label: "Attach to existing event…", run: () => phone.attachToEvent(e.id) });
    items.push({ label: "Remove from Casebook", danger: true, run: () => { g.dispatch({ type: "removeEvidence", id: e.id }); phone.refresh(); } });
    phone.sheet(phone.evidenceTitle(e), items);
  }

  /** For or against: the player's own reading of what a piece of evidence does to a theory. */
  function stanceSheet(hyId, evId) {
    const hy = g.casebook().hypotheses.find(x => x.id === hyId);
    const done = msg => { phone.toast(msg); phone.refresh(); };
    phone.actionSheet(hy?.label || "Theory", [
      { label: "For this theory", icon: "check", run: () => { g.link(hyId, evId, true, "supports"); done("Linked for."); } },
      { label: "Against this theory", icon: "close", run: () => { g.link(hyId, evId, true, "contradicts"); done("Linked against."); } },
      ...(hy && (hy.evidence.includes(evId) || hy.against.includes(evId)) ? [{ label: "Unlink", icon: "trash", secondary: true, run: () => { g.link(hyId, evId, false); done("Unlinked."); } }] : [])]);
  }

  function linkToTheory(e) {
    phone.picker({ title: "Link to theory", groups: [{ title: "", items: g.casebook().hypotheses.map(hy => ({ id: hy.id, label: hy.label,
      sub: hy.evidence.includes(e.id) ? "linked for" : hy.against.includes(e.id) ? "linked against" : `${hy.evidenceCount} for · ${hy.againstCount} against` })) }],
      onPick: id => stanceSheet(id, e.id) });
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

  // ── Selection mode ────────────────────────────────────────────────────
  // Long press (or "Select") on the Evidence tab. A bar at the top acts on what is ticked.
  function selectBar(desc) {
    const sel = desc.select;
    const done = () => phone.replaceTop({ ...desc, select: undefined });
    const shelveAll = () => phone.actionSheet(`Set aside ${sel.length} — your reason`, [
      { label: "Irrelevant", run: () => { sel.forEach(id => g.editEvidence(id, { shelf: "irrelevant" })); done(); } },
      { label: "Finished with it", run: () => { sel.forEach(id => g.editEvidence(id, { shelf: "finished" })); done(); } }]);
    return h("div.select-bar",
      h("b", `${sel.length} selected`),
      h("button.chip", { disabled: sel.length < 2, onclick: () => phone.push("casebook", { kind: "compare", items: sel.map(id => ({ evidence: id })) }) }, `Compare (${sel.length})`),
      h("button.chip", { disabled: sel.length < 2, onclick: () => connectTwo(sel) }, "Link"),
      h("button.chip", { disabled: !sel.length, onclick: shelveAll }, "Set aside"),
      h("button.bar-link", { onclick: done }, "Done"));
  }
  const selectOpts = (desc, e) => desc.select ? { selected: desc.select.includes(e.id),
    onToggle: () => phone.replaceTop({ ...desc, select: desc.select.includes(e.id) ? desc.select.filter(x => x !== e.id) : [...desc.select, e.id] }) }
    : { onLongPress: () => phone.replaceTop({ ...desc, select: [e.id] }) };

  function evidenceTab(desc) {
    const filter = desc.triage || "active";
    const list = [...g.s.evidence].reverse().filter(e => inFilter(e, desc.filter)).filter(e =>
      filter === "shelved" ? !!e.shelf : !e.shelf && (filter === "active" || (filter === "unreviewed" ? !e.marks.reviewed : !!e.marks[filter])));
    const controls = [triageFilters(desc), desc.select ? selectBar(desc)
      : g.s.evidence.length > 1 ? h("div.select-start", h("button.bar-link", { onclick: () => phone.replaceTop({ ...desc, select: [] }) }, "Select")) : null];
    if (!g.s.evidence.length) return [controls, h("div.empty", h("b", "No evidence yet."), h("div.muted", "Save a page, image, message or excerpt to collect it here."))];
    if (!list.length) return [controls, h("div.empty.muted", "No evidence with these filters.")];
    const pending = list.filter(e => !e.marks.reviewed);
    const reviewed = list.filter(e => e.marks.reviewed);
    const item = e => evItem(e, selectOpts(desc, e));
    const triage = [controls, pending.length ? h("div.section-title", `Not reviewed (${pending.length})`) : null, pending.map(item),
      reviewed.length ? h("div.section-title", `Reviewed (${reviewed.length})`) : null];
    const mode = desc.group ?? "about";
    const toggle = h("div.seg.small",
      h("button", { class: mode === "about" ? "on" : "", onclick: () => phone.replaceTop({ ...desc, group: "about" }) }, "By who it's about"),
      h("button", { class: mode === "all" ? "on" : "", onclick: () => phone.replaceTop({ ...desc, group: "all" }) }, "Newest first"));
    if (mode === "all") return [...triage, toggle, reviewed.map(item)];
    const groups = new Map();
    for (const e of reviewed) {
      const about = g.evidenceAbout(e.id)?.about || [];
      const keys = about.filter(id => ["person", "org", "account"].includes(g.topics().find(t => t.id === id)?.kind ?? ""));
      for (const k of keys.length ? keys : ["_other"]) { if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
    }
    const order = [...groups.keys()].sort((a, b) => (a === "_other") - (b === "_other") || groups.get(b).length - groups.get(a).length);
    const open = desc.open || {};
    return [...triage, toggle, order.map(k => {
      const t = g.topics().find(x => x.id === k);
      const isOpen = open[k] ?? false;
      return h("div.ev-group",
        h("button.ev-group-head", { onclick: () => phone.replaceTop({ ...desc, open: { ...open, [k]: !isOpen } }) },
          k === "_other" ? h("span.ev-ico.sm", icon("book")) : avatar(w, k, 32),
          h("div.pi-main", h("b", k === "_other" ? "Other" : t?.name || k), h("div.muted", k === "_other" ? "" : KIND_TITLES[t?.kind] || "")),
          h("span.count", String(groups.get(k).length)), h("span.chev", { class: isOpen ? "open" : "" }, "›")),
        isOpen ? groups.get(k).map(item) : null);
    })];
  }

  // ── Theories ────────────────────────────────────────────────────────────
  /** An example from a case the player has started; the Casebook itself knows no story. */
  const theoryExample = () => g.cases().map(c => w.mysteries.get(c.id)?.strings?.theoryExample).find(Boolean) || "Someone operates an account";

  const counts = hy => [STATUS[hy.status] || STATUS.open, `${hy.evidenceCount} for`, `${hy.againstCount} against`,
    `${hy.sourceCount} ${hy.sourceCount === 1 ? "source" : "sources"}`, hy.structured ? "" : "own words", hy.note ? "note" : ""].filter(Boolean).join(" · ");
  const hypRow = hy => h("button.hyp-row", { onclick: () => phone.push("casebook", { kind: "hyp", id: hy.id }) },
    h("div.hyp-label", hy.label), h("div.muted.hyp-counts", counts(hy)));

  function theoriesTab(desc) {
    const hyps = [...g.casebook().hypotheses].reverse().filter(hy => inFilter(hy, desc.filter));
    const live = hyps.filter(hy => hy.status !== "rejected"), rejected = hyps.filter(hy => hy.status === "rejected");
    return [h("button.new-msg", { onclick: () => phone.push("casebook", { kind: "builder" }) }, icon("plus"), "New theory"),
      live.map(hypRow),
      // Rejected theories keep every link; they are only folded away.
      rejected.length ? h("div.ev-group",
        h("button.ev-group-head", { onclick: () => phone.replaceTop({ ...desc, showRejected: !desc.showRejected }) },
          h("div.pi-main", h("b", "Rejected")), h("span.count", String(rejected.length)), h("span.chev", { class: desc.showRejected ? "open" : "" }, "›")),
        desc.showRejected ? rejected.map(hypRow) : null) : null,
      !hyps.length ? h("div.empty", h("b", "No theories yet."), h("div.muted", `Write what you think happened in your own words, or build a claim like “${theoryExample()}”. Link evidence for and against it.`)) : null];
  }

  function hypDetail(desc) {
    const cb = g.casebook();
    const hy = cb.hypotheses.find(x => x.id === desc.id);
    if (!hy) return h("div.empty", "This theory was deleted.");
    const ev = ids => ids.map(id => g.s.evidence.find(e => e.id === id)).filter(Boolean);
    const linked = ev(hy.evidence), against = ev(hy.against);
    const sources = new Map();
    for (const e of linked) {
      const key = g.evidenceAbout(e.id)?.source ?? e.id;   // visible source, never the hidden one
      if (!sources.has(key)) sources.set(key, { label: phone.sourceLabel(e), n: 0 });
      sources.get(key).n++;
    }
    const note = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 3, "aria-label": "Theory note", placeholder: "Your reasoning, doubts, what to check next…" }));
    note.value = hy.note || "";
    note.addEventListener("change", () => { g.dispatch({ type: "updateHypothesis", id: hy.id, patch: { note: note.value } }); phone.toast("Note saved."); });
    const more = e => h("button.icon-btn.ev-more", { "aria-label": "For or against", onclick: () => stanceSheet(hy.id, e.id) }, icon("more"));
    const add = stance => pickEvidence(stance === "supports" ? "Evidence for" : "Evidence against", [...hy.evidence, ...hy.against],
      id => { g.link(hy.id, id, true, stance); phone.refresh(); });
    const status = () => phone.actionSheet("My status for this theory", Object.entries(STATUS).map(([id, label]) => ({
      label, icon: hy.status === id ? "check" : undefined, run: () => { g.setTheoryStatus(hy.id, id); phone.refresh(); } })));
    const questions = cb.questions.filter(q => q.links.theories.includes(hy.id));
    const qIn = /** @type {HTMLInputElement} */ (h("input.text-input", { type: "text", "aria-label": "Question about this theory", placeholder: "A question this theory raises…" }));
    const ask = () => { const r = g.addQuestion({ text: qIn.value, links: { theories: [hy.id] } }); if (r.error) { phone.toast("Write the question first."); return; } phone.refresh(); };
    const alts = hy.alternatives.map(id => cb.hypotheses.find(x => x.id === id)).filter(Boolean);
    const mine = new Set([...hy.evidence, ...hy.against]);
    const links = cb.links.filter(l => mine.has(l.a) && mine.has(l.b));
    const addAlt = () => phone.actionSheet("Another explanation", [
      { label: "Write a new alternative…", icon: "plus", run: () => phone.push("casebook", { kind: "builder", alternativeOf: hy.id }) },
      { label: "Link an existing theory…", icon: "book", run: () => phone.picker({ title: "Alternative to this theory", empty: "No other theories yet.",
        groups: [{ title: "", items: cb.hypotheses.filter(x => x.id !== hy.id && !hy.alternatives.includes(x.id)).map(x => ({ id: x.id, label: x.label, sub: STATUS[x.status] })) }],
        onPick: id => { g.linkAlternative(hy.id, id); phone.refresh(); } }) }]);
    return h("div.hyp-detail",
      phone.ctx.block(h("div.hyp-big", richText(phone, hy.label)), { title: "Theory" }),
      hy.structured && hy.title ? h("div.hint.muted.hyp-claim", `As a claim: “${hy.claimLabel}”`) : null,
      !hy.structured ? h("div.hint.muted.hyp-claim", "In your own words. Add a claim (who, relation, what) when you want to publish it.") : null,
      h("div.pad.hyp-status", h("span.muted", "My status"),
        h("button.chip.status-chip", { "aria-label": `Status: ${STATUS[hy.status]}`, onclick: status }, STATUS[hy.status], h("span.chev", "▾"))),
      casesRow("hypothesis", hy),
      h("div.hyp-stats", h("div", h("b", String(hy.evidenceCount)), h("span", "for")), h("div", h("b", String(hy.sourceCount)), h("span", hy.sourceCount === 1 ? "source for" : "sources for")),
        h("div", h("b", String(hy.againstCount)), h("span", "against"))),
      sources.size ? h("div.sources", [...sources.values()].map(s => h("span.chip.static", `${s.label}${s.n > 1 ? ` ×${s.n}` : ""}`))) : null,
      h("div.hint.muted", "The Casebook counts your evidence and where it comes from. It can't tell you whether you're right."),
      h("div.section-title", `For (${linked.length})`),
      linked.length ? linked.map(e => evItem(e, { toggle: more(e) })) : h("div.empty.muted.small", "Nothing for it yet."),
      h("div.pad", h("button.btn.wide", { onclick: () => add("supports"), disabled: !g.s.evidence.length }, icon("plus"), " For")),
      h("div.section-title", `Against (${against.length})`),
      against.length ? against.map(e => evItem(e, { toggle: more(e) })) : h("div.empty.muted.small", "Nothing against it yet."),
      h("div.pad", h("button.btn.wide", { onclick: () => add("contradicts"), disabled: !g.s.evidence.length }, icon("plus"), " Against")),
      h("div.section-title", `Connections (${links.length})`),
      links.length ? links.map(l => linkRow(l)) : h("div.empty.muted.small", "None between this theory's evidence yet. Compare two pieces to connect them."),
      mine.size > 1 ? h("div.pad", h("button.btn.wide", { onclick: () => phone.push("casebook", { kind: "compare", items: [...hy.evidence, ...hy.against].map(id => ({ evidence: id })) }) }, `Compare all (${mine.size})`)) : null,
      h("div.section-title", `Questions (${questions.length})`),
      questions.map(q => questionRow(q)),
      h("div.pad.q-add", qIn, h("button.btn", { onclick: ask }, "Ask")),
      h("div.section-title", `Alternatives (${alts.length})`),
      alts.map(a => h("button.hist-row", { onclick: () => phone.push("casebook", { kind: "hyp", id: a.id }) }, icon("book"),
        h("div.pi-main", h("b", a.label), h("div.muted", STATUS[a.status])))),
      h("div.pad", h("button.btn.wide", { onclick: addAlt }, icon("plus"), " Alternative")),
      h("div.section-title", "Note"), h("div.pad", note),
      eventsOf(hy.id),
      h("div.section-title", "History"),
      h("div.status-log", hy.statusLog.map(x => h("div.log-row.muted", `Day ${x.day} · ${STATUS[x.status]}`))),
      h("div.hyp-actions",
        h("button.btn", { onclick: () => phone.push("casebook", { kind: "builder", id: hy.id, title: hy.title, subject: hy.subject ?? undefined, predicate: hy.predicate ?? undefined, object: hy.object ?? undefined }) }, icon("edit"), " Edit"),
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
    const started = !!(desc.subject || desc.predicate);
    const complete = !!(desc.subject && pred && (pred.arity === 1 || desc.object));
    const preview = complete ? g.hypothesisLabel({ subject: desc.subject, predicate: desc.predicate, object: desc.object }) : null;
    const words = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 3, "aria-label": "Theory in your own words", placeholder: "What do you think happened?" }));
    words.value = desc.title || "";
    const ready = () => (words.value.trim() || complete) && (!started || complete);
    const btn = /** @type {HTMLButtonElement} */ (h("button.btn.primary.wide", { onclick: () => save() }, desc.id ? "Save changes" : "Create theory"));
    btn.disabled = !ready();
    // Kept on the screen description, so picking a slot does not lose what was typed.
    words.addEventListener("input", () => { desc.title = words.value; btn.disabled = !ready(); });
    const save = () => {
      const triple = complete ? { subject: desc.subject, predicate: desc.predicate, object: pred?.arity === 2 ? desc.object : null } : { predicate: null };
      const title = words.value.trim();
      const r = desc.id ? g.dispatch({ type: "updateHypothesis", id: desc.id, patch: { title, ...triple } })
        : g.hypothesize({ title, ...(complete ? triple : {}), ...(desc.evidence ? { evidence: desc.evidence } : {}) });
      if (r.error) { phone.toast(ERRORS[r.error] || r.error); return; }
      if (!desc.id && desc.alternativeOf) g.linkAlternative(desc.alternativeOf, r.id);
      phone.back();
      if (!desc.id && !desc.alternativeOf) phone.push("casebook", { kind: "hyp", id: r.id });
    };
    return h("div.builder",
      desc.evidence?.length ? h("div.hint.muted", `Starts with ${desc.evidence.length} pieces of evidence for it.`) : null,
      desc.alternativeOf ? h("div.hint.muted", `An alternative to “${g.casebook().hypotheses.find(x => x.id === desc.alternativeOf)?.label || ""}”.`) : null,
      h("label.field-label", "In your own words"), words,
      h("div.field-label", "As a claim you could publish (optional)"),
      h("div.hint.muted", "Who, the relation, and who or what it points at. Only a claim can go into a report."),
      slot("Who or what", subjOk ? name(desc.subject) : "", () => pickTopic("Who or what is it about?", subjKinds, id => set({ subject: id }))),
      slot("Relation", pred?.label || "", () => phone.picker({ title: "Relation", groups: [{ title: "", items: availPreds.map(p => ({ id: p.id, label: p.label, sub: p.template.replace("{subject}", "…").replace("{object}", "…") })) }], onPick: id => set({ predicate: id }) })),
      pred?.arity === 2 ? slot("Who or what", desc.object ? name(desc.object) : "", () => pickTopic("Pointing at…", new Set(pred.objectKinds || []), id => set({ object: id }))) : null,
      h("div.preview", { class: preview ? "" : "muted" }, preview ? `“${preview}”` : started ? "Finish the claim, or clear it." : "No claim yet. That's fine while you think."),
      started ? h("button.btn.wide", { onclick: () => set({ subject: undefined, predicate: undefined, object: undefined }) }, "Clear claim") : null,
      btn);
  }

  // ── Comparison and connections ──────────────────────────────────────────
  // Side by side with the visible fields lined up (core/compare.js). The screen never says what
  // a difference means. Connections are the player's own claims and are never checked.

  function compareWith(e) {
    pickEvidence("Compare with", [e.id], id => phone.push("casebook", { kind: "compare", items: [{ evidence: e.id }, { evidence: id }] }));
  }

  // A connection is always between exactly two pieces of evidence. "Supports" and "Possibly
  // manipulated" have a direction (A → B); the other four do not. It is the player's reading only.
  const DIRECTED = new Set(["supports", "manipulated"]);
  /** The connection as a sentence, with A and B given as text or elements. */
  function linkSentence(kind, A, B) {
    switch (kind) {
      case "supports": return [A, " supports ", B];
      case "contradicts": return [A, " and ", B, " contradict each other"];
      case "related": return [A, " and ", B, " are connected"];
      case "same_origin": return [A, " and ", B, " have the same origin"];
      case "manipulated": return [A, " may be manipulated, compared with ", B];
      case "unrelated": return [A, " and ", B, " are not connected"];
      default: return [A, " · ", B];
    }
  }
  const evTitle = id => { const e = g.s.evidence.find(x => x.id === id); return e ? phone.evidenceTitle(e) : "—"; };
  /** A connection as one row. Seen from one piece of evidence (`from`), that side is "this". */
  function linkRow(l, from, letterOf) {
    const name = (id, first) => id === from ? (first ? "This" : "this") : h("b", letterOf?.(id) ? `${letterOf(id)} · ${evTitle(id)}` : evTitle(id));
    // An undirected connection seen from B reads from B's side; a directed one always keeps its order.
    const [x, y] = !DIRECTED.has(l.kind) && from === l.b ? [l.b, l.a] : [l.a, l.b];
    return h("button.hist-row.link-row", { onclick: () => phone.push("casebook", { kind: "link", a: l.a, b: l.b, id: l.id }) },
      h("span.stance", CONNECTIONS[l.kind]),
      h("div.pi-main", h("div.link-text", linkSentence(l.kind, name(x, true), name(y, false))), l.note ? h("div.muted", `“${l.note}”`) : null));
  }

  /** Connect two of several: pick the first, then the second. Two go straight to the editor. */
  function connectTwo(ids) {
    if (ids.length === 2) { phone.push("casebook", { kind: "link", a: ids[0], b: ids[1] }); return; }
    const opts = (skip, run) => ids.filter(id => id !== skip).map(id => ({ label: `${LETTERS[ids.indexOf(id)] ?? "·"} · ${evTitle(id)}`, run: () => run(id) }));
    phone.actionSheet("A connection is between two. Pick the first.", opts(null, a =>
      phone.actionSheet("…and the second.", opts(a, b => phone.push("casebook", { kind: "link", a, b })))));
  }

  function linkEditor(desc) {
    const l = desc.id ? g.casebook().links.find(x => x.id === desc.id) : null;
    if (desc.id && !l) return h("div.empty", "This connection was removed.");
    const kind = desc.pick ?? l?.kind ?? null; // desc.kind is the screen kind ("link")
    const base = l ? [l.a, l.b] : [desc.a, desc.b];
    const [a, b] = desc.swap ? [base[1], base[0]] : base;
    const ends = [a, b].map(id => g.s.evidence.find(e => e.id === id));
    if (ends.some(x => !x)) return h("div.empty", "This evidence is no longer in your Casebook.");
    const note = /** @type {HTMLInputElement} */ (h("input.text-input", { type: "text", "aria-label": "Because", placeholder: "Because… (optional)" }));
    note.value = desc.note ?? l?.note ?? "";
    note.addEventListener("input", () => { desc.note = note.value; });
    const save = () => {
      const r = l ? g.editLink(l.id, { kind, note: note.value, ...(desc.swap ? { swap: true } : {}) }) : g.addLink({ a, b, kind, note: note.value });
      if (r.error) { phone.toast(r.error === "duplicate_link" ? "You already connected these that way." : "Pick how they are connected."); return; }
      if (r.duplicate) phone.toast("You already connected these that way. Reason updated.");
      phone.back();
    };
    const directed = kind && DIRECTED.has(kind);
    return h("div.link-editor.pad",
      ends.map((e, i) => h("div.cmp-name", h("span.cmp-letter", LETTERS[i]), h("b", phone.evidenceTitle(e)))),
      h("div.field-label", "How are they connected?"),
      h("div.evidence-marks.link-kinds", Object.entries(CONNECTIONS).map(([id, label]) =>
        h("button.chip", { "aria-pressed": String(kind === id), onclick: () => phone.replaceTop({ ...desc, pick: id, note: note.value }) }, `${kind === id ? "✓ " : ""}${label}`))),
      kind ? h("div.link-sentence", { "aria-live": "polite" }, linkSentence(kind, h("b", "A"), h("b", "B")), ".") : null,
      directed ? h("div.link-direction",
        h("div.link-dir-row", h("span.cmp-letter", "A"), h("span", phone.evidenceTitle(ends[0])), h("span.muted.small", kind === "supports" ? "supports" : "suspected")),
        h("div.link-arrow", { "aria-hidden": "true" }, "↓"),
        h("div.link-dir-row", h("span.cmp-letter", "B"), h("span", phone.evidenceTitle(ends[1])), h("span.muted.small", kind === "supports" ? "is supported" : "reference")),
        h("button.btn.wide", { onclick: () => phone.replaceTop({ ...desc, swap: !desc.swap, pick: kind, note: note.value }) }, "⇅ Swap A and B")) : null,
      h("label.field-label", "Because"), note,
      h("div.hint.muted", "Your own reading. Nothing checks it."),
      h("button.btn.primary.wide", { disabled: !kind, onclick: save }, l ? "Save changes" : "Save connection"),
      l ? h("button.btn.wide.danger-btn", { onclick: () => phone.sheet("Remove this connection? The evidence stays.", [{ label: "Remove connection", danger: true, run: () => { g.removeLink(l.id); phone.back(); } }]) }, icon("trash"), " Remove connection") : null);
  }

  /** Two images: show one at a time at the same zoom and position, and switch between them. */
  function imagePair(desc, pics) {
    const show = Math.min(desc.show ?? 0, pics.length - 1), zoom = desc.zoom ?? 1;
    const im = img(pics[show].image, { cls: "cmp-img", eager: true });
    const stage = h("div.cmp-stage", im);
    let pan = desc.pan ?? { x: 0, y: 0 };
    const apply = () => { im.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`; };
    apply();
    let start = null;
    stage.addEventListener("pointerdown", e => { if (zoom === 1) return; start = { x: e.clientX - pan.x, y: e.clientY - pan.y }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", e => { if (!start) return; pan = { x: e.clientX - start.x, y: e.clientY - start.y }; apply(); });
    stage.addEventListener("pointerup", () => { if (start) desc.pan = pan; start = null; });
    const set = patch => phone.replaceTop({ ...desc, pan, ...patch });
    return h("div.cmp-images",
      stage,
      h("div.cmp-img-cap.muted", `${LETTERS[pics[show].i]} · ${pics[show].title}`),
      h("div.cmp-img-tools",
        h("div.seg.small", pics.map((p, k) => h("button", { class: k === show ? "on" : "", "aria-label": `Show ${LETTERS[p.i]}`, onclick: () => set({ show: k }) }, `Show ${LETTERS[p.i]}`))),
        h("button.icon-btn", { "aria-label": "Zoom out", disabled: zoom <= 1, onclick: () => set({ zoom: Math.max(1, zoom / 1.5), ...(zoom / 1.5 <= 1 ? { pan: { x: 0, y: 0 } } : {}) }) }, "−"),
        h("span.muted.cmp-zoom", `${Math.round(zoom * 100)}%`),
        h("button.icon-btn", { "aria-label": "Zoom in", disabled: zoom >= 5, onclick: () => set({ zoom: Math.min(5, zoom * 1.5) }) }, "+")));
  }

  function compareScreen(desc) {
    const c = g.compare(desc.items);
    if (c.error) return h("div.empty", "Pick at least two things to compare.");
    const ok = c.items.map((x, i) => ({ ...x, i })).filter(x => !x.error);
    const missing = c.items.filter(x => x.error).length;
    const KIND = { page: "Saved page", excerpt: "Excerpt", image: "Image", message: "Message" };
    // An unsaved page (from Browser's Archive, W8) is a "Page", not a "Saved page".
    const what = x => x.kind === "page" && x.evidence == null ? "Page" : KIND[x.kind];
    const rows = [["What", what, "kind"], ["Source", x => x.source, "source"], ["Platform", x => x.platform, "platform"],
      ["Address", x => x.url, "url"], ["Date", x => x.date ? fmtDate(x.date) : x.day != null && x.kind === "message" ? `Day ${x.day}` : null, "date"],
      ["Copy", x => x.copy, "copy"], ["Author", x => x.author, "author"],
      ["Saved", x => x.evidence ? `Day ${g.s.evidence.find(e => e.id === x.evidence)?.day}` : "Not saved", null]];
    // Image info lines up too, row by row, for images.
    const pics = ok.filter(x => x.image);
    const infoRows = pics.length ? [...new Set(pics.flatMap(x => imageInfoRows(x.imageInfo, x.image).map(([k]) => k)))] : [];
    const val = v => v == null || v === "" ? h("span.muted", "—") : String(v);
    const table = h("div.cmp-table", { style: `--cols: ${ok.length}` },
      h("div.cmp-row.head", h("div.cmp-label"), ok.map(x => h("div.cmp-cell", h("span.cmp-letter", LETTERS[x.i]), h("b", x.title || "—")))),
      rows.map(([label, f, key]) => h("div.cmp-row", { class: key && c.differs[key] ? "differs" : "" }, h("div.cmp-label", label), ok.map(x => h("div.cmp-cell", val(f(x)))))),
      infoRows.map(k => h("div.cmp-row", h("div.cmp-label", k), ok.map(x => h("div.cmp-cell", x.image ? val(Object.fromEntries(imageInfoRows(x.imageInfo, x.image))[k]) : h("span.muted", "—"))))));
    const ids = ok.map(x => x.evidence).filter(Boolean);
    const saveAll = () => {
      const next = desc.items.map((r, i) => {
        if (r.evidence || c.items[i].error) return r;
        // Saves exactly the copy shown here, so the evidence is the version that was compared.
        const res = g.save(r.message ? { message: r.message } : { artifact: r.artifact, version: c.items[i].version ?? undefined, ...(r.image ? { image: r.image } : {}) });
        return res.ok ? { evidence: res.id } : r;
      });
      phone.toast("Saved to Casebook."); phone.replaceTop({ ...desc, items: next });
    };
    const texts = ok.filter(x => x.text || x.attachments?.length);
    return h("div.compare",
      h("div.hint.muted", "Side by side. Rows marked • differ. What it means is up to you."),
      missing ? h("div.hint.muted", `${missing} ${missing === 1 ? "item isn't" : "items aren't"} available to compare.`) : null,
      h("div.cmp-scroll", table),
      ok.length > 2 ? h("div.hint.muted", `Swipe the table sideways to see all ${ok.length}.`) : null,
      pics.length >= 2 ? [h("div.section-title", "Images"), imagePair(desc, pics)] : pics.length === 1 ? h("div.pad", img(pics[0].image, { cls: "evidence-preview" })) : null,
      c.changes ? [h("div.section-title", `Changes from ${LETTERS[ok[0].i]} to ${LETTERS[ok[1].i]}`),
        c.changes.title ? h("div.cmp-change.title", h("span.muted", "Title: "), h("s", c.changes.title[0]), " → ", c.changes.title[1]) : null,
        c.changes.text.every(x => x.op === "same") ? h("div.empty.muted.small", "The text is the same.") :
          c.changes.text.map(x => h("div.cmp-change", { class: `op-${x.op}` }, h("span.cmp-op", { "aria-label": x.op }, x.op === "removed" ? "−" : x.op === "added" ? "+" : ""), h("span", x.text)))] : null,
      texts.map(x => [h("div.section-title", `${LETTERS[x.i]} · ${what(x) || "Page"}`),
        h("div.cmp-text", x.text ? richText(phone, x.text) : null, x.attachments?.length ? h("div.muted", `Attached: ${x.attachments.join(", ")}`) : null)]),
      h("div.section-title", `Your connections (${c.links.length})`),
      c.links.map(l => linkRow(l, null, id => { const i = c.items.findIndex(x => x.evidence === id); return i >= 0 ? LETTERS[i] : null; })),
      h("div.pad.cmp-actions",
        c.saved ? h("button.btn.primary.wide", { onclick: () => connectTwo(ids) }, ids.length === 2 ? "How are they connected?" : "Connect two of these")
          : h("button.btn.primary.wide", { onclick: saveAll }, "Save to Casebook to connect them"),
        c.saved ? h("button.btn.wide", { onclick: () => phone.push("casebook", { kind: "builder", evidence: ids }) }, "New theory from this") : null,
        c.saved ? h("button.btn.wide", { onclick: () => phone.newEvent({ evidence: ids.map(id => ({ id, stance: "supports" })) }) }, "New event from this") : null));
  }

  // ── Questions ───────────────────────────────────────────────────────────
  // The player's own open questions. One home (Notes); theories and evidence show them by reference.
  function questionRow(q) {
    const n = Object.values(q.links).reduce((a, l) => a + l.length, 0);
    return h("button.hist-row.q-row", { class: q.status, onclick: () => phone.push("casebook", { kind: "question", id: q.id }) },
      h("span.q-mark", q.status === "answered" ? "✓" : q.status === "dropped" ? "–" : "?"),
      h("div.pi-main", h("b", q.text), h("div.muted", [Q_STATUS[q.status], `day ${q.day}`, n ? `${n} ${n === 1 ? "link" : "links"}` : "", (q.cases || []).length ? casesLabel(q) : ""].filter(Boolean).join(" · "))));
  }

  function questionsView(desc) {
    const input = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 2, "aria-label": "New question", placeholder: "Something you don't know yet…" }));
    const add = () => { const r = g.addQuestion({ text: input.value }); if (r.error) { phone.toast("Write the question first."); return; } phone.refresh(); };
    const qs = [...g.casebook().questions].reverse().filter(q => inFilter(q, desc.filter));
    const part = (status, title) => { const l = qs.filter(q => q.status === status); return l.length ? [h("div.section-title", `${title} (${l.length})`), l.map(questionRow)] : null; };
    return [h("div.pad", input, h("button.btn.primary.wide", { onclick: add }, "Add question")),
      part("open", "Open"), part("answered", "Answered"), part("dropped", "Set aside"),
      !qs.length ? h("div.empty.muted", "Write down what you don't know yet. Link a question to evidence, people, sources or theories.") : null];
  }

  function questionDetail(desc) {
    const cb = g.casebook();
    const q = cb.questions.find(x => x.id === desc.id);
    if (!q) return h("div.empty", "This question was deleted.");
    const text = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input.q-text", { rows: 2, "aria-label": "Question" }));
    text.value = q.text;
    text.addEventListener("change", () => { const r = g.editQuestion(q.id, { text: text.value }); if (r.error) { text.value = q.text; phone.toast("A question can't be empty."); } });
    const answer = /** @type {HTMLTextAreaElement} */ (h("textarea.note-input", { rows: 2, "aria-label": "My answer", placeholder: "Your answer (optional)" }));
    answer.value = q.answer || "";
    answer.addEventListener("input", () => g.editQuestion(q.id, { answer: answer.value }));
    const statusChip = (id, label) => h("button.chip", { "aria-pressed": String(q.status === id), onclick: () => { g.editQuestion(q.id, { status: id }); phone.refresh(); } }, `${q.status === id ? "✓ " : ""}${label}`);
    const topics = g.topics(), sources = g.visibleSources();
    const unlink = (kind, ref) => h("button.icon-btn.ev-more", { "aria-label": "Remove link", onclick: () => { g.linkQuestion(q.id, kind, ref, false); phone.refresh(); } }, icon("close"));
    const linkRow = (kind, ref) => {
      if (kind === "evidence") { const e = g.s.evidence.find(x => x.id === ref); return e ? evItem(e, { toggle: unlink(kind, ref) }) : null; }
      let label = ref, ico = "book", go = null;
      if (kind === "topics") { const t = topics.find(x => x.id === ref); label = t?.name || w.entities.get(ref)?.name || ref; ico = "people";
        go = () => phone.ctx.open({ type: t?.kind === "account" ? "account" : t?.kind || "term", text: label, id: ref }); }
      if (kind === "sources") { label = sources.find(s => s.key === ref)?.label || ref; ico = "globe"; }
      if (kind === "theories") { label = cb.hypotheses.find(x => x.id === ref)?.label || ref; go = () => phone.push("casebook", { kind: "hyp", id: ref }); }
      return h("div.ev-item", h("button.ev-open", { onclick: go || (() => {}) }, h("span.ev-ico", icon(ico)),
        h("div.ev-main", h("b", label), h("div.muted.ev-sub", LINK_KINDS[kind]))), unlink(kind, ref));
    };
    const link = (kind, ref) => { g.linkQuestion(q.id, kind, ref, true); phone.refresh(); };
    const addLink = {
      evidence: () => pickEvidence("Link evidence", q.links.evidence, id => link("evidence", id)),
      topics: () => {
        const by = new Map();
        for (const t of topics.filter(t => !q.links.topics.includes(t.id))) { if (!by.has(t.kind)) by.set(t.kind, []); by.get(t.kind).push(t); }
        phone.picker({ title: "Link a person or thing", search: true, empty: "You haven't looked into anyone or anything yet.", note: TOPIC_NOTE,
          groups: [...by.entries()].map(([k, items]) => ({ title: (KIND_TITLES[k] || k) + "s", items: items.sort((a, b) => a.name.localeCompare(b.name)).map(t => ({ id: t.id, label: t.name })) })),
          onPick: id => link("topics", id) });
      },
      sources: () => phone.picker({ title: "Link a source", search: true, empty: "Sources appear when you save evidence.",
        groups: [{ title: "", items: sources.filter(s => !q.links.sources.includes(s.key)).sort((a, b) => a.label.localeCompare(b.label)).map(s => ({ id: s.key, label: s.label, sub: `${s.count} evidence` })) }],
        onPick: id => link("sources", id) }),
      theories: () => phone.picker({ title: "Link a theory", empty: "No theories yet.",
        groups: [{ title: "", items: cb.hypotheses.filter(x => !q.links.theories.includes(x.id)).map(x => ({ id: x.id, label: x.label, sub: STATUS[x.status] })) }],
        onPick: id => link("theories", id) }),
    };
    const n = Object.values(q.links).reduce((a, l) => a + l.length, 0);
    return h("div.question-detail.pad",
      h("label.field-label", "Question"), text,
      h("div.field-label", "Status"), h("div.evidence-marks", statusChip("open", "Open"), statusChip("answered", "Answered"), statusChip("dropped", "Set aside")),
      q.status === "answered" ? [h("label.field-label", "My answer"), answer] : null,
      casesRow("question", q),
      h("div.section-title", `Linked to (${n})`),
      Object.keys(LINK_KINDS).flatMap(kind => q.links[kind].map(ref => linkRow(kind, ref))),
      h("div.sources.q-links", Object.entries(LINK_KINDS).map(([kind, label]) => h("button.chip", { onclick: addLink[kind] }, icon("plus"), label))),
      h("div.section-title", "History"),
      h("div.status-log", q.statusLog.map(x => h("div.log-row.muted", `Day ${x.day} · ${Q_STATUS[x.status]}`))),
      h("button.btn.wide.danger-btn", { onclick: () => phone.sheet("Delete this question?", [{ label: "Delete question", danger: true, run: () => { g.deleteQuestion(q.id); phone.back(); } }]) }, icon("trash"), " Delete question"));
  }

  // ── Notes ───────────────────────────────────────────────────────────────
  function notesTab(desc) {
    const view = desc.notesView || "notes";
    const open = g.casebook().questions.filter(q => q.status === "open" && inFilter(q, desc.filter)).length;
    const seg = h("div.seg.small",
      h("button", { class: view === "notes" ? "on" : "", onclick: () => phone.replaceTop({ ...desc, notesView: "notes", scroll: 0 }) }, "Notes"),
      h("button", { class: view === "questions" ? "on" : "", onclick: () => phone.replaceTop({ ...desc, notesView: "questions", scroll: 0 }) }, `Questions${open ? ` (${open})` : ""}`));
    return [seg, view === "questions" ? questionsView(desc) : notesList(desc)];
  }

  function notesList(desc) {
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
      ["notes", phone.str("casebook.notes"), n(g.s.notes) + n((g.s.questions || []).filter(q => q.status === "open"))], ["timeline", "Timeline", n(g.s.timeline)]];
    return [h("div.seg.tabs.four", tabs.map(([id, label, n]) => h("button", { class: tab === id ? "on" : "", onclick: () => phone.replaceTop({ ...desc, tab: id, scroll: 0 }) },
      h("span", label), h("small", String(n))))),
      h("div.cb", tab === "evidence" ? null : filterBar(desc), tab === "evidence" ? evidenceTab(desc) : tab === "theories" ? theoriesTab(desc) : tab === "timeline" ? timelineTab(desc) : notesTab(desc))];
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
      pickEvidence("Attach evidence", ev.evidence.map(x => x.id),
        id => phone.actionSheet("This evidence…", [
          { label: "Supports the event", icon: "check", run: () => { g.linkEvent(ev.id, id, "supports"); phone.refresh(); } },
          { label: "Contradicts the event", icon: "close", run: () => { g.linkEvent(ev.id, id, "contradicts"); phone.refresh(); } }]));
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
    // Only theories with a claim can be published. Theories in the player's own words stay in the Casebook.
    const all = g.casebook().hypotheses, hyps = all.filter(hy => hy.structured), unready = all.length - hyps.length, evs = g.timeline();
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
      hyps.length ? group(hyps).map(([t, l]) => [h("div.field-label.sub", t), l.map(hy => row(desc.hyps.includes(hy.id), hy.claimLabel,
        `${hy.evidenceCount} evidence · ${hy.sourceCount} ${hy.sourceCount === 1 ? "source" : "sources"}`, () => tog("hyps", hy.id)))]) :
        h("div.muted.small", "Build a theory with a claim first. Each theory you pick becomes a claim."),
      unready ? h("div.muted.small", `${unready} ${unready === 1 ? "theory is" : "theories are"} only in your own words. Add a claim to publish ${unready === 1 ? "it" : "them"}.`) : null,
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
      if (desc.kind === "evidence") return [bar("Evidence"), h("div.scroll", evidenceDetail(desc))];
      if (desc.kind === "hyp") return [bar("Theory"), h("div.scroll", hypDetail(desc))];
      if (desc.kind === "builder") return [bar(desc.id ? "Edit theory" : desc.alternativeOf ? "Alternative" : "New theory"), h("div.scroll", builder(desc))];
      if (desc.kind === "question") return [bar("Question"), h("div.scroll", questionDetail(desc))];
      if (desc.kind === "compare") return [bar("Compare"), h("div.scroll", compareScreen(desc))];
      if (desc.kind === "link") return [bar(desc.id ? "Connection" : "New connection"), h("div.scroll", linkEditor(desc))];
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
