<template>
  <div class="context-menu" :style="{ left: x + 'px', top: y + 'px' }">
    <div class="menu-item" @click="handleAction('edit')">编辑事务</div>
    <div class="menu-item" @click="handleAction('duplicate')">复制事务</div>
    <div class="menu-item" @click="handleAction('constraint')">添加约束</div>
    <div class="menu-item" @click="handleAction('color')">更改颜色</div>
    <div class="menu-item" @click="handleAction('delete')">删除事务</div>
  </div>
</template>

<script>
import { onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'ContextMenu',
  props: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    itemId: {
      type: String,
      required: true
    }
  },
  emits: ['action', 'close'],
  setup(props, { emit }) {
    const handleOutsideClick = (e) => {
      // 检查点击是否在菜单外部
      const menu = document.querySelector('.context-menu')
      if (menu && !menu.contains(e.target)) {
        emit('close')
      }
    }

    const handleAction = (action) => {
      emit('action', { action, itemId: props.itemId })
      emit('close')
    }

    onMounted(() => {
      document.addEventListener('click', handleOutsideClick)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleOutsideClick)
    })

    return {
      handleAction
    }
  }
}
</script>