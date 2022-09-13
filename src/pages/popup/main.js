(async function () {
  window.addEventListener("message", async function (e) {
    try {
      let name = e.data.name;
      let meta = e.data.meta;
      let data = e.data.data;
      if (name === "close_button_click") {
        window.close();
      } else if (name === "update_settings") {
        chrome.storage.local.set({ settings: data.settings });
      }
    } catch (e) {}
  });

  // !---------------------------------------------------------------------------------------------------------------------------------------------------------------------
  let config = await fetch("/config.json");

  config = await config.json();
  // let storage = await chrome.storage.local.get(["settings"]);

  let manifest = chrome.runtime.getManifest();
  iframe = document.createElement("iframe");
  iframe.name = JSON.stringify({
    context: "iframe",
    config,
    manifest,
  });
  iframe.src = config.popup_urls[config.mode];
  document.body.append(iframe);
})();
