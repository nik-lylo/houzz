import Util from "chromane/js/Util.js";
import Overrider from "chromane/js/Overrider.js";

const _state = {
  next_item: null,
  current_item: null,
};
(function () {
  window.util = new Util();
  window.overrider = new Overrider();
  let window_wrap = window.util.create_window_wrap(window, window);
  window.overrider.override_xhr((message) => {
    try {
      const url = message.data.request_url;
      if (url.endsWith("spf=navigate") || url.endsWith("spf=load")) {
        const data = JSON.parse(message.data.response_text);
        const buzz_data = parse_navigate_data(data);
        if (buzz_data) {
          window_wrap.exec("intercepted_data", {
            data: buzz_data,
            type: "nav",
          });
        }
      }
    } catch (e) {
      return;
    }
  });

  function parse_navigate_data(data) {
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
})();
