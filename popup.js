const defaults = { homeFeed: true, exploreFeed: true, reels: true, hideFooterLinks: false, hideSuggestedPeople: false };
const status = document.getElementById("status");
const controls = [...document.querySelectorAll("input[data-setting]")];

chrome.storage.local.get(defaults, (saved) => {
  controls.forEach((control) => {
    control.checked = saved[control.dataset.setting] !== false;
  });
});

controls.forEach((control) => {
  control.addEventListener("change", () => {
    const key = control.dataset.setting;
    chrome.storage.local.set({ [key]: control.checked }, () => {
      status.textContent = "Settings changed";
      window.setTimeout(() => {status.textContent = "Settings were changed";}, 1400);
    });
  });
});
