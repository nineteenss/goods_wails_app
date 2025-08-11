document.addEventListener("keydown", (e) => {
  if (e.key === "F5") {
    e.preventDefault();
  }

  if (e.ctrlKey && e.key === "r") {
    e.preventDefault();
  }

  if (e.ctrlKey && e.shiftKey && e.key === "I") {
    e.preventDefault();
  }

  if (e.ctrlKey && e.key === "u") {
    e.preventDefault();
  }

  if (e.key === "F12") {
    e.preventDefault();
  }
});

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

document.addEventListener("dragstart", (e) => {
  e.preventDefault();
});

document.addEventListener("drop", (e) => {
  e.preventDefault();
});

document.addEventListener("selectstart", (e) => {
  const target = e.target as HTMLElement;
  if (!target.matches('input, textarea, [contenteditable="true"]')) {
    e.preventDefault();
  }
});
