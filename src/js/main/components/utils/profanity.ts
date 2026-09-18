import bannedWordsRaw from "../../../assets/banned-words.txt?raw";
import bepolite from "../../../assets/volume/be-polite.mp3";

let listeMots = bannedWordsRaw.split("\n").map(m => m.trim().toLowerCase()).filter(m => m.length > 0);

export function filterText(text: string, replacement = "be more polite"): string {
  if (!text || listeMots.length === 0) return text;
  
  let resultat = text;
  for (let i = 0; i < listeMots.length; i++) {
    let mot = listeMots[i];
    let regex = new RegExp("\\b" + mot + "\\b", "gi");
    resultat = resultat.replace(regex, replacement);
  }
  return resultat;
}

export function censorField(node: HTMLTextAreaElement, options?: { replacement?: string }): { update(): void; destroy(): void } {
  let replacement = (options && options.replacement) || "be more polite";
  let audio = new Audio(bepolite);

  function handleInput() {
    let original = node.value;
    let filtered = filterText(original, replacement);

    if (filtered === original) return;

    audio.currentTime = 0;
    audio.play().catch(() => {});

    let cursor = node.selectionStart;
    node.value = filtered;

    try {
      node.setSelectionRange(cursor, cursor);
    } catch (e) {}

    node.dispatchEvent(new Event("input", { bubbles: true }));
  }

  node.addEventListener("input", handleInput);

  return {
    update() {},
    destroy() {
      node.removeEventListener("input", handleInput);
    },
  };
}