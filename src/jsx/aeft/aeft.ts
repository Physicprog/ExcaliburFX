import { dispatchTS } from "../utils/utils";

function isNameSpaceAvailable(): void {
  if (typeof app === "undefined") {
    throw new Error("L'objet 'app' n'est pas disponible. Assurez-vous que le script est exécuté dans l'environnement After Effects.");
  }
}

export const helloWorld = () => {
  alert("Hello from After Effects!");
  app.project.activeItem;
};

export function getActiveCompName(): string | null {
  const activeItem = app.project && app.project.activeItem;
  return activeItem && activeItem.name ? activeItem.name : null;
}

export const testAlert = (msg: string): string => {
  alert(msg);
  return "L'alerte a été envoyée au logiciel !";
};

export const getRandomNumber = (): number => {
  return Math.round(Math.random() * 100);
};