<template>
  <div class="timeline-wrapper">
    <div ref="timelineContainer" class="timeline-container"></div>
    <div class="timeline-controls">
      <button class="btn btn-sm" @click="fitTimeline">适应窗口</button>
      <button class="btn btn-sm" @click="zoomIn">放大</button>
      <button class="btn btn-sm" @click="zoomOut">缩小</button>
      <span class="timeline-info">拖拽调整时间 | 双击编辑 | 右键菜单</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

export default {
  name: 'TimelineComponent',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    groups: {
      type: Array,
      default: () => []
    },
    constraints: {
      type: Map,
      default: () => new Map()
    },
    timeRange: {
      type: Object,
      required: true
    },
    timeScale: {
      type: Number,
      default: 30
    }
  },
  emits: ['item-changed', 'item-double-click', 'item-context-menu', 'timeline-ready'],
  setup(props, { emit, expose }) {
    const timelineContainer = ref(null)
    const timeline = ref(null)
    const visItems = ref(null)
    const visGroups = ref(null)

    const initTimeline = () => {
      if (!timelineContainer.value) return

      // 初始化数据集
      visItems.value = new vis.DataSet()
      visGroups.value = new vis.DataSet()
      
      // 添加数据
      if (props.items.length > 0) {
        visItems.value.add(props.items.map(item => ({
          ...item,
          className: 'transaction-item',
          editable: true
        })))
      }
      
      if (props.groups.length > 0) {
        visGroups.value.add(props.groups)
      }

      // 配置选项
      const options = {
        editable: {
          add: true,
          updateTime: true,
          updateGroup: false,
          remove: true
        },
        stack: false,
        showCurrentTime: true,
        orientation: 'top',
        zoomable: true,
        moveable: true,
        multiselect: true,
        snap: (date, scale, step) => {
          const hour = date.getHours()
          const minute = date.getMinutes()
          const alignedMinute = Math.round(minute / props.timeScale) * props.timeScale
          return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, alignedMinute)
        },
        format: {
          minorLabels: {
            minute: 'HH:mm',
            hour: 'HH:mm'
          },
          majorLabels: {
            minute: 'ddd DD MMMM',
            hour: 'ddd DD MMMM'
          }
        },
        locale: 'zh-CN'
      }

      // 创建时间轴
      timeline.value = new vis.Timeline(timelineContainer.value, visItems.value, visGroups.value, options)

      // 设置初始时间范围
      if (props.timeRange.start && props.timeRange.end) {
        timeline.value.setWindow(props.timeRange.start, props.timeRange.end)
      }

      // 绑定事件
      setupTimelineEvents()
      
      emit('timeline-ready', timeline.value)
    }

    const setupTimelineEvents = () => {
      if (!timeline.value) return

      // 项目变化事件
      timeline.value.on('changed', (properties) => {
        if (properties && properties.items && Array.isArray(properties.items) && properties.items.length > 0) {
          emit('item-changed', properties.items)
        }
      })

      // 双击事件
      timeline.value.on('doubleClick', (properties) => {
        if (properties.item) {
          emit('item-double-click', properties.item)
        } else {
          emit('item-double-click', null, properties.time)
        }
      })

      // 右键菜单事件
      timeline.value.on('contextmenu', (properties) => {
        properties.event.preventDefault()
        if (properties.item) {
          emit('item-context-menu', {
            itemId: properties.item,
            x: properties.event.clientX,
            y: properties.event.clientY
          })
        }
      })
    }

    const fitTimeline = () => {
      if (timeline.value) {
        timeline.value.fit()
      }
    }

    const zoomIn = () => {
      if (timeline.value) {
        timeline.value.zoomIn(0.2)
      }
    }

    const zoomOut = () => {
      if (timeline.value) {
        timeline.value.zoomOut(0.2)
      }
    }

    const getSelection = () => {
      return timeline.value ? timeline.value.getSelection() : []
    }

    const setSelection = (ids) => {
      if (timeline.value) {
        timeline.value.setSelection(ids)
      }
    }

    // 监听数据变化
    watch(() => props.items, (newItems) => {
      if (visItems.value) {
        visItems.value.clear()
        visItems.value.add(newItems.map(item => ({
          ...item,
          className: 'transaction-item',
          editable: true
        })))
      }
    }, { deep: true })

    watch(() => props.groups, (newGroups) => {
      if (visGroups.value) {
        visGroups.value.clear()
        visGroups.value.add(newGroups)
      }
    }, { deep: true })

    watch(() => props.timeRange, (newRange) => {
      if (timeline.value && newRange.start && newRange.end) {
        timeline.value.setWindow(newRange.start, newRange.end)
      }
    }, { deep: true })

    onMounted(() => {
      initTimeline()
    })

    onBeforeUnmount(() => {
      if (timeline.value) {
        timeline.value.destroy()
      }
    })

    // 暴露方法给父组件
    expose({
      fitTimeline,
      zoomIn,
      zoomOut,
      getSelection,
      setSelection
    })

    return {
      timelineContainer,
      fitTimeline,
      zoomIn,
      zoomOut
    }
  }
}
</script>
