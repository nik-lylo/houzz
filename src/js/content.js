import Airtable from "airtable";

(async function () {
  if (window !== window.top) {
    return;
  }

  let _state = {
    current_destination: null,
    loader: `<div class="chromane-loader"> <svg version="1.1" id="L9" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
      <path fill="#gray" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
        <animateTransform 
           attributeName="transform" 
           attributeType="XML" 
           type="rotate"
           dur="1s" 
           from="0 50 50"
           to="360 50 50" 
           repeatCount="indefinite" />
    </path>
  </svg>
  </div>
  ​`,
    air_api_key: "keyHJv4NjO0fmAWyv",
    air_base: "appkOXbvYL0CXEJoh",
    air_table_name: "Table",
    air_table: null,
    is_loading: false,
  };
  await init();
  await exec_dom_data_get();

  //   !Main Function------------------------------------------------------------------------------------------------------------

  async function init() {
    navigation.addEventListener("navigate", async (e) => {
      const destination = e.destination.url;
      if (!destination) return;
      if (destination === _state.current_destination) return;
      _state.current_destination = destination;
      if (destination.includes("photos")) {
        const data = await get_prefetch_data(destination);
        if (!data) return;
        const buzz_data = parse_buzz_data(data);
        if (!buzz_data) return;
        await add_overlay_to_detail_image(buzz_data[0]);
      }
      if (destination.includes("projects")) {
        const data = await get_projects_data(destination);
        if (!data) return;
        const buzz_data = parse_buzz_data(data);
        if (!buzz_data) return;
        await add_overlay_to_images(buzz_data);
      }
    });

    await connect_to_airtable();
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
      return null;
    }
  }

  async function add_overlay_to_images(arr) {
    await timeout(500);
    let first_el = null;
    for (const item of arr) {
      const elem = document.querySelector(`[href='${item.url}']`);
      if (elem) {
        const overlay = create_overlay(item);
        const is_overlay_exist = elem.querySelector(".chromane-houzz-overlay");
        if (is_overlay_exist) {
          is_overlay_exist.parentElement.replaceChild(
            overlay,
            is_overlay_exist
          );
        } else {
          elem.append(overlay);
        }
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
        const overlay = create_overlay(obj);
        overlay.style.fontSize = "22px";
        overlay.style.right = "80px";
        if (has_overlay) {
          has_overlay.parentElement.replaceChild(overlay, has_overlay);
        } else {
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

  async function get_projects_data(location) {
    try {
      let arr = location.split("?");
      let checked_location = location;
      if (arr.length > 1) {
        checked_location = arr[0];
      }
      const projects_response = await fetch(
        `${checked_location}?spf=navigate`,
        {
          headers: {
            "sec-fetch-site": "same-origin",
            "x-hz-request": "true",
            "x-hz-spf-request": "true",
            "x-requested-with": "XMLHttpRequest",
          },
          referrerPolicy: "origin-when-cross-origin",
          body: null,
          method: "GET",
          mode: "cors",
          credentials: "include",
        }
      );
      const projects_data = await projects_response.json();
      return projects_data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function connect_to_airtable() {
    const base = new Airtable({ apiKey: _state.air_api_key }).base(
      _state.air_base
    );
    const table = base(_state.air_table_name);
    _state.air_table = table;
  }
  async function handle_overlay_click(e, item) {
    e.stopImmediatePropagation();
    e.preventDefault();
    if (_state.is_loading) return;
    e.target.style.width = e.target.offsetWidth + "px";
    e.target.style.height = e.target.offsetHeight + "px";
    const fields = {
      Link: item.url,
      ["Buzz Count"]: item.buzz_count,
    };
    startLoading(e.target);
    const response = await _state.air_table.create([
      {
        fields,
      },
    ]);
    stopLoading(e.target, item.buzz_count);
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

  function startLoading(el) {
    el.innerHTML = _state.loader;
    console.log(el);
    _state.is_loading = true;
  }
  function stopLoading(el, buzz_count) {
    el.innerHTML = `buzz:${buzz_count}`;
    _state.is_loading = false;
  }

  function create_overlay(item) {
    const div = document.createElement("div");
    div.classList.add("chromane-houzz-overlay");
    div.innerHTML = `buzz:${item.buzz_count}`;
    div.addEventListener("click", (e) => handle_overlay_click(e, item));
    return div;
  }
})();
