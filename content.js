(() => {
  const defaults = { homeFeed: true, exploreFeed: true, reels: true, hideFooterLinks: false, hideSuggestedPeople: false };
  const classes = {
    home: "ig-sem-feed-home",
    explore: "ig-sem-feed-explore",
    blockHome: "ig-sem-feed-block-home",
    blockExplore: "ig-sem-feed-block-explore",
    blockReels: "ig-sem-feed-block-reels",
    suggestedHidden: "ig-sem-feed-suggested-hidden",
  };
  let settings = { ...defaults };
  const hiddenFeeds = new Map();

  function restoreFeeds() {
    for (const [feed, originalDisplay] of hiddenFeeds) {
      feed.style.display = originalDisplay;
    }
    hiddenFeeds.clear();
  }

  function hideHomeFeed() {
    const article = document.querySelector('[role="main"] article, main article, article');
    if (!article) return;
    const feed = article.parentElement?.parentElement?.parentElement;
    if (!feed || hiddenFeeds.has(feed)) return;
    hiddenFeeds.set(feed, feed.style.display);
    feed.style.display = "none";
  }

  function updateSuggestedPeople() {
    document.querySelectorAll(`.${classes.suggestedHidden}`).forEach((element) => {
      element.classList.remove(classes.suggestedHidden);
    });
    if (!settings.hideSuggestedPeople) return;
    const link = document.querySelector('a[href*="/explore/people/"]');
    const heading = link?.closest("div");
    if (!heading) return;
    heading.classList.add(classes.suggestedHidden);
    if (heading.nextElementSibling) {
      heading.nextElementSibling.classList.add(classes.suggestedHidden);
    }
  }

  function updateRoute() {
    const root = document.documentElement;
    if (!root?.classList) return;
    const currentSettings = { ...defaults, ...(settings || {}) };
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const home = path === "/";
    const explore = path === "/explore" || path.startsWith("/explore/");
    const setClass = (name, enabled) => {
      if (typeof name === "string" && name.length > 0) root.classList.toggle(name, enabled === true);
    };
    setClass(classes.home, home);
    setClass(classes.explore, explore);
    setClass(classes.blockHome, currentSettings.homeFeed);
    setClass(classes.blockExplore, currentSettings.exploreFeed);
    setClass(classes.blockReels, currentSettings.reels);
    setClass("ig-sem-feed-hide-footer", currentSettings.hideFooterLinks);

    if (home && currentSettings.homeFeed) hideHomeFeed();
    else restoreFeeds();
    updateSuggestedPeople();
  }

  updateRoute();
  chrome.storage.local.get(defaults, (saved) => {
    settings = { ...defaults, ...saved };
    updateRoute();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const key of Object.keys(defaults)) {
      if (changes[key]) settings[key] = changes[key].newValue !== false;
    }
    updateRoute();
  });

  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      updateRoute();
      return result;
    };
  }
  addEventListener("popstate", updateRoute);
  addEventListener("hashchange", updateRoute);
  document.addEventListener("click", () => queueMicrotask(updateRoute), true);
  let observerScheduled = false;
  new MutationObserver(() => {
    if (observerScheduled) return;
    observerScheduled = true;
    requestAnimationFrame(() => {
      observerScheduled = false;
      const path = location.pathname.replace(/\/+$/, "") || "/";
      const root = document.documentElement;
      const shouldBeHome = path === "/";
      const shouldBeExplore = path === "/explore" || path.startsWith("/explore/");
      if (root && (root.classList.contains(classes.home) !== shouldBeHome || root.classList.contains(classes.explore) !== shouldBeExplore)) {
        updateRoute();
      }
      if (path === "/" && settings.homeFeed) hideHomeFeed();
      if (settings.hideSuggestedPeople) updateSuggestedPeople();
    });
  }).observe(document, { childList: true, subtree: true });
})();
