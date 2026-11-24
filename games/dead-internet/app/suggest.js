// @ts-check
// Search suggestions under a search field. Earlier searches (one tap repeats them) and names
// the player has investigated. The list comes from game.suggest(), which never offers anything
// the player has not acted on.

import { h, icon } from "./ui.js";

/**
 * @param {any} phone
 * @param {HTMLInputElement} input
 * @param {HTMLElement} form   the suggestions are placed under this element
 * @param {(q:string)=>void} onPick
 * @param {string} [initial]  the field's starting value (an address): treated as empty until edited
 */
export function suggestBox(phone, input, form, onPick, initial = "") {
  const box = h("div.suggest", { role: "listbox" });
  form.classList.add("has-suggest");
  form.append(box);
  const draw = () => {
    const v = input.value === initial ? "" : input.value;
    const list = phone.g.suggest(v, 6);
    box.replaceChildren(...list.map(s => {
      const b = h("button.suggest-item", { type: "button", role: "option" }, icon(s.kind === "history" ? "clock" : "search"), h("span", s.text));
      // pointerdown so the pick happens before the field loses focus
      b.addEventListener("pointerdown", e => { e.preventDefault(); close(); onPick(s.text); });
      return b;
    }));
    box.classList.toggle("on", list.length > 0);
  };
  const close = () => box.classList.remove("on");
  input.addEventListener("focus", draw);
  input.addEventListener("input", draw);
  input.addEventListener("blur", () => setTimeout(close, 120));
}
