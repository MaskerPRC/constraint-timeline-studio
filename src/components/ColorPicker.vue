<template>
  <div class="color-picker-overlay" @click.self="$emit('close')">
    <div class="color-picker-content">
      <h4>选择颜色</h4>
      <div class="color-options">
        <div 
          v-for="color in colors" 
          :key="color"
          class="color-option" 
          :style="{ backgroundColor: color }"
          @click="selectColor(color)"
        ></div>
      </div>
      <button class="btn btn-secondary" @click="$emit('close')">取消</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColorPicker',
  props: {
    itemId: {
      type: String,
      required: true
    }
  },
  emits: ['color-selected', 'close'],
  data() {
    return {
      colors: ['#e5613a', '#ffffff', '#333333', '#666666', '#999999', '#cccccc', '#000000', '#d54f28']
    }
  },
  methods: {
    selectColor(color) {
      this.$emit('color-selected', { itemId: this.itemId, color })
      this.$emit('close')
    }
  }
}
</script>