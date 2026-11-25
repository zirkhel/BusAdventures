// Scripted playthroughs of The Quiet Account. Each step is a game call; `expect` lists
// what must be true at the end. Used by tools/simulate.mjs and tests/scenarios.test.mjs.
// The scripts only use information a player would have at that point.

const ev = (g, ref) => g.save(ref).id;
// A player can only ask about, or theorise about, what they have investigated: tapping a name they
// read and picking an action does that. These helpers do the tap first.
const ask = (g, who, topic) => { reach(g, who); g.investigate(topic); return g.ask(who, topic); };
const show = (g, who, ...a) => { reach(g, who); return g.show(who, ...a); };
const reply = (g, who, ...a) => { reach(g, who); return g.reply(who, ...a); };
const reach = (g, who) => { const c = g.w.characters.get(who); if (c?.account && !g.canContact(who)) g.investigate(c.account); };
const hyp = (g, t) => { g.investigate(t.subject); if (t.object) g.investigate(t.object); return g.hypothesize(t); };
const lastFrom = (g, who) => [...g.s.messages].reverse().find(m => m.thread === who && m.from !== "player");

/** Brother + journalist route, ending with a Daily Record story before the vote. */
function brotherAndJournalist(g) {
  const r = gather(g);
  g.review("daily_record", [r.h2, r.h3]);
  g.publish("daily_record", [r.h2, r.h3]);
  g.sleep();
  return r;
}

/** The same investigation, but the story only runs after the vote. */
function tooLate(g) {
  const r = gather(g);
  while (g.s.day < 9) g.sleep();
  g.publish("daily_record", [r.h2, r.h3]);
  g.sleep();
  return r;
}

/** A wrong accusation against someone real, published on an open channel. */
const accuse = (subject, evidence, channel) => g => {
  g.start();
  g.search("Mara Quinn"); g.open("A16"); g.open("A17");
  for (const a of evidence) g.open(a);
  const ids = evidence.map(a => ev(g, { artifact: a }));
  const h = hyp(g, { subject, predicate: "operates", object: "acc_maraquinn" }).id;
  ids.forEach(e => g.link(h, e));
  g.publish(channel, [h]);
  g.sleep();
  return { h };
};

export function gather(g) {
  g.start();
  // Day 1: who was Mara, and is this really her?
  g.search("Mara Quinn obituary"); g.open("A11");
  g.open("A02"); g.open("A05");
  const sign = ev(g, { artifact: "A05", image: "IMG01" });
  g.searchImage("IMG01"); g.open("A33");
  const orig = ev(g, { artifact: "A33" });
  g.search("Theo Quinn"); g.open("A06");
  ask(g, "theo", "calder_mill");               // "who is this" — first contact
  ask(g, "theo", "calder_mill");               // "she called it the old girl" (+2)
  show(g, "theo", "A33");                      // the photo is from May → Theo forwards his emails
  g.sleep();
  // Day 2: follow the recovery address
  g.open("A32");
  const emails = ev(g, { artifact: "A32" });
  g.search("bl-ops.net"); g.open("A19");
  ask(g, "dana", "mara");                      // first contact
  ask(g, "dana", "mara");                      // the death notice / quote (+1)
  show(g, "dana", "A32");                      // → anonymous invoice (+2)
  g.open("A25");
  const invoice = ev(g, { artifact: "A25" });
  ask(g, "dana", "brightline");                // mentions Iris Bell
  g.sleep();
  // Day 3: the insider and the money
  ask(g, "iris", "brightline");                // "how did you find me"
  show(g, "iris", "A32");                      // "…where did you get that"
  show(g, "iris", "A33");                      // opens up, attaches the dashboard and the brief
  g.open("A23"); g.open("A22");
  const dash = ev(g, { artifact: "A23" }), brief = ev(g, { artifact: "A22" });
  g.search("Northgate lobbying"); g.open("A26");
  const lobby = ev(g, { artifact: "A26" });
  const h2 = hyp(g, { subject: "brightline", predicate: "operates", object: "acc_maraquinn" }).id;
  [emails, dash, brief].forEach(e => g.link(h2, e));
  // Point 9 (Anders, 25.11.2026): the player draws the bl-ops.net–Brightline inference themselves,
  // from visible traces (the recovery address in Theo's emails, the portal address on Brightline's
  // services page), as an explicit Supports link. Dana counts the emails through it.
  g.addLink({ a: emails, b: brief, kind: "supports", note: "The recovery address is on bl-ops.net, Brightline's client portal domain (services page)." });
  const h3 = hyp(g, { subject: "northgate", predicate: "paid", object: "brightline" }).id;
  [invoice, lobby].forEach(e => g.link(h3, e));
  g.note("Theo's email: recovery address r…@bl-ops.net. bl-ops.net = Brightline client portal.");
  return { h2, h3, sign, orig };
}

/** Owen's route, believed uncritically and published on Threadline. */
function believeOwen(g) {
  g.start();
  g.search("Mara Quinn dead"); g.open("A16");
  const thread = ev(g, { artifact: "A16" });
  ask(g, "owen", "mara");                      // first contact → dossier
  g.open("A18");
  const dossier = ev(g, { artifact: "A18" });
  g.search("Kestrel Logistics"); g.open("A38");
  const kestrel = ev(g, { artifact: "A38" });
  const h = hyp(g, { subject: "northgate", predicate: "caused", object: "evt_mara_death" }).id;
  [thread, dossier, kestrel].forEach(e => g.link(h, e));
  g.publish("threadline", [h]);
  return { h };
}

/** Viral, but no money: a Connect post about the dead woman's account. */
function ghostStory(g) {
  g.start();
  g.search("Mara Quinn obituary"); g.open("A11");
  const notice = ev(g, { artifact: "A11" });
  g.search("Theo Quinn"); g.open("A06");
  const theo = ev(g, { artifact: "A06" });
  g.open("A05");
  const sign = ev(g, { artifact: "A05", image: "IMG01" });
  g.searchImage("IMG01"); g.open("A33");
  const orig = ev(g, { artifact: "A33" });
  const h1 = hyp(g, { subject: "mara", predicate: "is_dead" }).id;
  [notice, theo].forEach(e => g.link(h1, e));
  const h8 = hyp(g, { subject: "acc_maraquinn", predicate: "not_real" }).id;
  [sign, orig].forEach(e => g.link(h8, e));
  g.publish("connect", [h1, h8]);
  while (g.s.day < 8) g.sleep();
}

/** Do nothing until the vote. */
function silence(g) { g.start(); while (g.s.day < 8) g.sleep(); }

/** Lights Out, then pull on the CEO thread. */
function whoPaidWhom(g) {
  brotherAndJournalist(g);
  g.open("A20"); g.open("A09");
  const team = ev(g, { artifact: "A20", image: "IMG08" });
  g.searchImage("IMG06"); g.open("A31");
  const stock = ev(g, { artifact: "A31" });
  g.search("Brightline Media LLC"); g.open("A27");
  const reg = ev(g, { artifact: "A27" });
  const h7 = hyp(g, { subject: "calvin", predicate: "not_real" }).id;
  [team, stock, reg].forEach(e => g.link(h7, e));
  // Point 9: the profile whose photo is the stock picture, saved and linked by the player. The
  // stock page names no one, so Dana counts it only through the explicit Supports link.
  const prof = ev(g, { artifact: "A09" }); g.link(h7, prof);
  g.addLink({ a: stock, b: prof, kind: "supports", note: "Same face as the stock photo" });
  g.publish("daily_record", [h7]);
  g.sleep();
}

/** Use Iris' login, then lie about it. */
function portalAndLie(g) {
  brotherAndJournalist(g);
  ask(g, "iris", "mara"); ask(g, "iris", "acc_eastfieldnotes");   // trust up to 6
  ask(g, "iris", "brightline");                                   // gives the login
  const r = g.login("brightline_portal", "iris.bell", "garden2025!");
  g.open("A24");
  g.sleep();
  reply(g, "iris", "no");
  return { login: r };
}

/** Juno is shown three pieces of evidence that she is a stock photo with borrowed pictures. */
function breakJuno(g) {
  g.start();
  g.open("A02"); g.open("A04"); g.open("A07"); g.open("A37");
  g.searchImage("IMG04"); g.open("A31B");
  g.searchImage("IMG05", true); g.open("A36");
  ask(g, "juno", "mara");
  show(g, "juno", "A31B"); show(g, "juno", "A37"); show(g, "juno", "A07");
  g.sleep();
}


/** Official sites, a stock face, and repeated phrasing, then the same case as Lights Out. */
function designAsClue(g) {
  g.start();
  // 18 Harbor Street and the firms that share it, starting from HarborDesk.
  g.search("HarborDesk"); g.open("B18"); g.open("W-harbordesk-0003"); g.open("W-harbordesk-0004");
  g.open("W-quayledger-0001"); g.open("W-northlamp-0001");
  // The testimonial face is a purchased stock portrait: image search leads to Faceless #44812
  // and to other independent uses, not only Brightline.
  g.searchImage("IMG06A"); g.open("A31"); g.open("W-havenmutual-0001"); g.open("A09");
  g.search("Brightline Media"); g.open("W-brightline-0001"); g.open("A19"); g.open("A20");
  g.open("A20", "v2024");
  // "Fifteen years" and no Brightline archive before 2023; Kestrel has a 2014 cache.
  g.search("Kestrel Logistics"); g.open("W-kestrel-0001"); g.open("W-kestrel-0001", "v2014");
  // The same phrasing as Eastfield Notes v2, in Insights and in two Garden personas.
  g.open("W-brightline-0020"); g.open("W-garden-0001"); g.open("W-garden-0002"); g.open("A34");
  // Lumen is a commercial theme, also used by Harbor Dental — a deliberate red herring.
  g.search("Harbor Dental"); g.open("W-harbordental-0001");
  // The same investigation as gather(), from here on, so the case still closes logically.
  g.search("Mara Quinn obituary"); g.open("A11");
  g.open("A02"); g.open("A05");
  const sign = ev(g, { artifact: "A05", image: "IMG01" });
  g.searchImage("IMG01"); g.open("A33");
  const orig = ev(g, { artifact: "A33" });
  g.search("Theo Quinn"); g.open("A06");
  ask(g, "theo", "calder_mill");
  ask(g, "theo", "calder_mill");
  show(g, "theo", "A33");
  g.sleep();
  g.open("A32");
  const emails = ev(g, { artifact: "A32" });
  g.search("bl-ops.net"); g.open("A19");
  ask(g, "dana", "mara");
  ask(g, "dana", "mara");
  show(g, "dana", "A32");
  g.open("A25");
  const invoice = ev(g, { artifact: "A25" });
  ask(g, "dana", "brightline");
  g.sleep();
  ask(g, "iris", "brightline");
  show(g, "iris", "A32");
  show(g, "iris", "A33");
  g.open("A23"); g.open("A22");
  const dash = ev(g, { artifact: "A23" }), brief = ev(g, { artifact: "A22" });
  g.search("Northgate lobbying"); g.open("A26");
  const lobby = ev(g, { artifact: "A26" });
  const h2 = hyp(g, { subject: "brightline", predicate: "operates", object: "acc_maraquinn" }).id;
  [emails, dash, brief].forEach(e => g.link(h2, e));
  // Point 9 (Anders, 25.11.2026): the player draws the bl-ops.net–Brightline inference themselves,
  // from visible traces (the recovery address in Theo's emails, the portal address on Brightline's
  // services page), as an explicit Supports link. Dana counts the emails through it.
  g.addLink({ a: emails, b: brief, kind: "supports", note: "The recovery address is on bl-ops.net, Brightline's client portal domain (services page)." });
  const h3 = hyp(g, { subject: "northgate", predicate: "paid", object: "brightline" }).id;
  [invoice, lobby].forEach(e => g.link(h3, e));
  g.note("Theo's email: recovery address r…@bl-ops.net. bl-ops.net = Brightline client portal.");
  g.review("daily_record", [h2, h3]);
  g.publish("daily_record", [h2, h3]);
  g.sleep();
  return { h2, h3, sign, orig };
}

export const SCENARIOS = [
  { id: "design_as_clue", title: "Stock faces and shared phrases, then the Daily Record before the vote", run: designAsClue,
    expect: g => [
      ["Lights Out reached", g.s.endings.includes("quiet_account:lights_out")],
      ["S2 and S3 exposed through the Daily Record", g.s.exposed.S2?.channel === "daily_record" && g.s.exposed.S3?.channel === "daily_record"],
      ["Faceless #44812 was found from an independent stock-photo use", "A31" in g.s.seen],
      ["the 2024 Brightline team cache was opened", g.s.seen.A20 != null],
      ["Kestrel's 2014 cache was opened", "W-kestrel-0001" in g.s.seen],
      ["the shared phrasing was read on Insights and on Garden personas", "W-brightline-0020" in g.s.seen && "W-garden-0001" in g.s.seen && "W-garden-0002" in g.s.seen],
      ["credibility went up", g.s.credibility > 50],
    ] },
  { id: "lights_out", title: "Brother and journalist → Daily Record before the vote", run: brotherAndJournalist,
    expect: g => [
      ["Lights Out reached", g.s.endings.includes("quiet_account:lights_out")],
      ["S2 and S3 exposed through the Daily Record", g.s.exposed.S2?.channel === "daily_record" && g.s.exposed.S3?.channel === "daily_record"],
      ["Mara's profile is memorialized", g.view("A02").versionId === "v_memorial"],
      ["Juno's account is suspended", g.s.accounts.acc_junopark?.deleted === true],
      ["Theo writes back the next day", !!lastFrom(g, "theo")?.text.includes("memorialized")],
      ["credibility went up", g.s.credibility > 50],
      ["the dead account stops posting once memorialized", !["A47", "A48", "A50"].some(id => g.view(id).error == null)],
    ] },
  { id: "wrong_murder", title: "Believe Owen → murder claim on Threadline", run: believeOwen,
    expect: g => [
      ["The Wrong Murder reached", g.s.endings.includes("quiet_account:wrong_murder")],
      ["F1 is published", "F1" in g.s.published],
      ["nothing is exposed", Object.keys(g.s.exposed).length === 0],
      ["credibility went down", g.s.credibility < 50],
      ["Brightline is still up", g.view("A19").error == null],
    ] },
  { id: "ghost_story", title: "Dead woman's account goes viral, no money trail", run: ghostStory,
    expect: g => [
      ["Ghost Story reached", g.s.endings.includes("quiet_account:ghost_story")],
      ["vote passed", !!g.s.flags.vote_passed],
      ["Lights Out not reached", !g.s.endings.includes("quiet_account:lights_out")],
    ] },
  { id: "silence", title: "Nothing published before the vote", run: silence,
    expect: g => [
      ["Silence reached", g.s.endings.includes("quiet_account:silence")],
      ["Mara's account celebrates the vote", g.view("A50").error == null],
      ["the info night post appeared on day 4", g.view("A47").error == null],
    ] },
  { id: "who_paid_whom", title: "Lights Out, then the CEO who isn't there", run: whoPaidWhom,
    expect: g => [
      ["Who Paid Whom reached", g.s.endings.includes("quiet_account:who_paid_whom")],
      ["S7 exposed", g.s.exposed.S7?.strength === "strong"],
      ["the unknown sender writes", g.s.messages.some(m => m.from === "acc_unknown" && m.text.includes("gardener"))],
    ] },
  { id: "portal_lie", title: "Use Iris' login, then deny it", run: portalAndLie,
    expect: g => [
      ["login worked", g.s.flags.portal_used === true],
      ["Iris' public profile is gone", g.view("A08").error != null],
      ["Iris has cut contact", g.s.flags.iris_cut === true],
      ["Iris no longer answers", (ask(g, "iris", "brightline"), lastFrom(g, "iris")?.text.includes("Don't contact me again"))],
      ["portal session was revoked", !g.s.loggedIn.brightline_portal],
    ] },
  { id: "too_late", title: "The whole story, published after the vote", run: tooLate,
    expect: g => [
      ["Too Late reached", g.s.endings.includes("quiet_account:too_late")],
      ["Lights Out not reached", !g.s.endings.includes("quiet_account:lights_out")],
      ["the vote passed, and the paper reported it", !!g.s.flags.vote_passed && g.view("A68").error == null],
      ["the player is told the case closed", g.s.notifications.some(n => n.ref?.case === "quiet_account" && /Too late/.test(n.text))],
    ] },
  { id: "collateral_theo", title: "Accuse the brother on Threadline", run: accuse("theo", ["A16"], "threadline"),
    expect: g => [
      ["Collateral reached", g.s.endings.includes("quiet_account:collateral_theo")],
      ["Theo stops answering", g.s.flags.theo_blocked === true],
      ["Unfiltered picks up the post", g.view("A69").error == null],
    ] },
  { id: "collateral_owen", title: "Accuse Owen on Connect", run: accuse("owen", ["A17"], "connect"),
    expect: g => [
      ["Collateral reached", g.s.endings.includes("quiet_account:collateral_owen")],
      ["Owen writes", !!lastFrom(g, "owen")?.text.includes("hacker")],
    ] },
  { id: "collateral_iris", title: "Name Iris as the one behind the account", run: accuse("iris", ["A08"], "threadline"),
    expect: g => [
      ["Collateral reached", g.s.endings.includes("quiet_account:collateral_iris")],
      ["Iris' account is gone", g.s.accounts.acc_irisbell?.deleted === true],
    ] },
  { id: "juno", title: "Show Juno the truth three times", run: breakJuno,
    expect: g => [
      ["Juno reached stage 3", g.s.counters.juno_stage === 3],
      ["Juno's account is gone", g.s.accounts.acc_junopark?.deleted === true],
      ["Juno's last post is only in the cache", g.view("A43").error != null && g.view("A43", "v1").error == null],
      ["the mirrored photo was found with Flip & search", "A36" in g.s.seen],
    ] },
];
