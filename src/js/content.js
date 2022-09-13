import Util from "chromane/js/Util.js";

let script = document.createElement("script");
script.src = chrome.runtime.getURL("/js/injected.js");
document.documentElement.prepend(script);

(async function () {
  if (window !== window.top) {
    return;
  }

  let _state = { current_destination: null };
  await init();
  await exec_dom_data_get();

  //   !Main Function------------------------------------------------------------------------------------------------------------

  async function init() {
    window.util = new Util();
    window.util.create_window_api({
      intercepted_data: async (data) => {
        const b_data = data.data;
        if (window.location.href.includes("projects")) {
          await add_overlay_to_images(b_data);
          return;
        }
      },
    });
    navigation.addEventListener("navigate", async (e) => {
      const destination = e.destination.url;
      if (!destination) return;
      if (destination === _state.current_destination) return;
      _state.current_destination = destination;
      if (!destination.includes("photos")) return;
      const data = await get_prefetch_data(destination);
      if (!data) return;
      const buzz_data = parse_buzz_data(data);
      if (!buzz_data) return;
      await add_overlay_to_detail_image(buzz_data[0]);
    });
  }

  async function exec_dom_data_get() {
    const buzz_data = await get_buzz_data_from_dom(5);
    if (!buzz_data) return;
    if (window.location.href.includes("projects")) {
      await add_overlay_to_images(buzz_data);
    }
    if (window.location.href.includes("photos")) {
      await add_overlay_to_detail_image(buzz_data[0]);
    }
  }

  async function get_buzz_data_from_dom(count) {
    try {
      if (!count) return null;
      const script = document.getElementById("hz-ctx");
      if (!script) {
        await timeout(700);
        return await get_buzz_data_from_dom(count - 1);
      }
      const data = JSON.parse(script.innerHTML);
      const image_data = data.data.stores.data.SpaceStore.data;
      let result = [];
      Object.values(image_data).forEach((item) => {
        if (item.buzzCount || item.buzzCount === 0) {
          const obj = {
            id: item.id,
            url: item.url,
            image_ids: item.imageIds,
            buzz_count: item.buzzCount,
          };
          result.push(obj);
        }
      });
      return result;
    } catch (e) {
      console.error("Parse error", e);
      return null;
    }
  }

  async function add_overlay_to_images(arr) {
    await timeout(2000);
    let first_el = null;
    for (const item of arr) {
      const elem = document.querySelector(`[href='${item.url}']`);
      if (elem) {
        const overlay = create_overlay(item);
        elem.append(overlay);
        if (!first_el) {
          first_el = elem;
        }
      }
    }
    await timeout(2000);
    if (!first_el) {
      return await add_overlay_to_images(arr);
    }
    const check = first_el.querySelector(".chromane-houzz-overlay");
    if (!check) {
      return await add_overlay_to_images(arr);
    }
  }

  async function add_overlay_to_detail_image(obj) {
    if (!obj) return;
    if (!obj.image_ids) return;
    obj.image_ids.forEach((item) => {
      const image = document.querySelector(
        `.view-photo-image-pane [src*="${item}"]`
      );
      if (image) {
        const has_overlay = image.parentElement.querySelector(
          ".chromane-houzz-overlay"
        );
        if (has_overlay) {
          has_overlay.innerHTML = `buzz:${obj.buzz_count}`;
        } else {
          const overlay = create_overlay(obj);
          overlay.style.fontSize = "22px";
          image.parentElement.append(overlay);
        }
      }
    });
    await timeout(2000);

    const check = document.querySelector(
      ".view-photo-image-pane .chromane-houzz-overlay"
    );
    if (!check) {
      return await add_overlay_to_detail_image(obj);
    }
  }

  async function get_prefetch_data(location) {
    try {
      let response = await fetch(`${location}?spf=prefetch`, {
        headers: {
          accept: "*/*",
          "accept-language":
            "en-US,en;q=0.9,ru;q=0.8,uk-UA;q=0.7,uk;q=0.6,la;q=0.5",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua":
            '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Linux"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-hz-request": "true",
          "x-hz-spf-request": "true",
          "x-hz-view-mode": "",
          "x-requested-with": "XMLHttpRequest",
        },
        referrerPolicy: "origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
      });
      const data = await response.json();
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  //   !Helpers--------------------------------------------------------------------------------------------------------

  function parse_buzz_data(data) {
    try {
      const image_data = data.ctx.data.stores.data.SpaceStore.data;
      const result = [];
      Object.values(image_data).forEach((item) => {
        if (item.buzzCount || item.buzzCount === 0) {
          const obj = {
            id: item.id,
            url: item.url,
            buzz_count: item.buzzCount,
            image_ids: item.imageIds,
          };
          result.push(obj);
        }
      });
      return result;
    } catch (e) {
      console.error("Navigate parse Error", e);
      return null;
    }
  }

  async function timeout(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }

  function create_overlay(item) {
    const div = document.createElement("div");
    div.classList.add("chromane-houzz-overlay");
    div.innerHTML = `buzz:${item.buzz_count}`;
    div.style.position = "absolute";
    div.style.top = "10px";
    div.style.right = "20px";
    div.style.fontSize = "19px";
    div.style.textShadow =
      "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black";
    div.style.fontWeight = "700";
    div.style.letterSpacing = "1px";
    div.style.color = "white";

    return div;
  }
})();
