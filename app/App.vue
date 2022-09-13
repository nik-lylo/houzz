<script>
import Drawer from "../node_modules/chromane/components/Drawer.vue";
import Toggle from "../node_modules/chromane/components/Toggle.vue";
import Header from "../node_modules/chromane/components/Header.vue";

export default {
  components: {
    Drawer,
    Toggle,
    Header,
  },
  data() {
    return {
      title: "Default extension",
      settings: {},
      drawer_items: [{}],
      drawer_status: "closed",
    };
  },
  methods: {
    drawer_overlay_click: function () {
      this.drawer_status = "closed";
    },
    menu_button_click: function () {
      this.drawer_status = "opened";
    },
    close_button_click: function () {
      window.parent.postMessage(
        {
          name: "close_button_click",
        },
        "*"
      );
    },
    handle_toggle: function (item) {
      item.value = !item.value;
      window.parent.postMessage(
        {
          name: "update_settings",
          data: {
            settings: JSON.parse(JSON.stringify(this.settings)),
          },
        },
        "*"
      );
    },
  },
};
</script>
<template>
  <div class="app">
    <Header
      :title="title"
      v-on:menu_button_click="this.menu_button_click"
      v-on:close_button_click="this.close_button_click"
    ></Header>
    <Drawer
      :title="title"
      :items="drawer_items"
      :status="this.drawer_status"
      v-on:drawer_overlay_click="this.drawer_overlay_click"
    ></Drawer>
    <div class="page"></div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}
body {
  font-family: "Roboto";
}
.page {
  padding: 24px 0px;
  width: 100%;
  height: 100%;
}
.main-title {
  font-size: 19px;
  letter-spacing: 0.4px;
  font-weight: 500;
  color: black;
}
.page .chromane-toggle {
  margin-bottom: 12px;
}
</style>
