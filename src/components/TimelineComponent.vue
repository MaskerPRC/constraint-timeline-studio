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
import { Timeline, DataSet } from 'vis-timeline/standalone'

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
    
    // 约束处理相关
    const constraintTimeout = ref(null)
    const hoveredItem = ref(null)

    const initTimeline = () => {
      if (!timelineContainer.value) return

      console.log('📊 初始化vis-timeline组件...')
      
      console.log('✅ 开始初始化vis-timeline数据集')
      
      // 初始化数据集
      visItems.value = new DataSet()
      visGroups.value = new DataSet()
      
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

      // 配置选项 - 参考原始代码
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
          // 对齐到时间刻度
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
        locale: 'zh-CN',
        locales: {
          'zh-CN': {
            current: '当前时间',
            time: '时间',
            deleteSelected: '删除选中项'
          }
        }
      }

      // 创建时间轴
      timeline.value = new Timeline(timelineContainer.value, visItems.value, visGroups.value, options)

      // 设置初始时间范围
      if (props.timeRange.start && props.timeRange.end) {
        timeline.value.setWindow(props.timeRange.start, props.timeRange.end)
      }

      // 绑定事件 - 参考原始代码的事件处理
      setupTimelineEvents()
      
      emit('timeline-ready', timeline.value)
      console.log('✅ vis-timeline组件初始化完成')
    }

    const setupTimelineEvents = () => {
      if (!timeline.value) return

      console.log('🔗 设置时间轴事件监听...')

      // 使用高频率的changed事件来模拟实时约束 - 参考原始代码
      timeline.value.on('changed', (properties) => {
        if (properties && properties.items && Array.isArray(properties.items) && properties.items.length > 0) {
          console.log('📝 时间轴项目变化:', properties.items)
          // 先快速应用实时约束
          emit('item-changed', properties.items)
          
          // 然后完整处理所有约束
          clearTimeout(constraintTimeout.value)
          constraintTimeout.value = setTimeout(() => {
            emit('item-changed', properties.items)
          }, 50)
        }
      })

      // 监听数据变化，实现更实时的约束处理 - 参考原始代码
      visItems.value.on('update', (event, properties) => {
        // 当vis-timeline数据更新时，同步回Vue数据并触发约束检查
        if (properties && properties.items && Array.isArray(properties.items) && properties.items.length > 0) {
          console.log('📊 vis-timeline数据更新:', properties.items)
          
          // 同步vis-timeline的数据变化回Vue
          syncVisDataToVue()
          
          clearTimeout(constraintTimeout.value)
          constraintTimeout.value = setTimeout(() => {
            console.log('⚡ 数据更新触发约束检查:', properties.items)
            emit('item-changed', properties.items)
          }, 10) // 10毫秒延迟，确保实时响应
        }
      })

      // 添加鼠标事件监听，实现更实时的约束处理
      timeline.value.on('itemover', (properties) => {
        // 当鼠标悬停在项目上时，准备实时约束处理
        hoveredItem.value = properties.item
      })

      // 双击编辑
      timeline.value.on('doubleClick', (properties) => {
        if (properties.item) {
          emit('item-double-click', properties.item)
        } else {
          // 双击空白区域创建新事务
          emit('item-double-click', null, properties.time)
        }
      })

      // 右键菜单
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

      // 选择变化
      timeline.value.on('select', (properties) => {
        console.log('🎯 选择变化:', properties.items)
      })

      console.log('✅ 时间轴事件监听设置完成')
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

    // 同步vis-timeline数据变化回Vue - 这是约束系统工作的关键
    const syncVisDataToVue = () => {
      if (!visItems.value) return
      
      const visData = visItems.value.get()
      
      // 更新Vue的items数据，但不触发watch以避免循环
      props.items.forEach((vueItem, index) => {
        const visItem = visData.find(item => item.id === vueItem.id)
        if (visItem) {
          // 直接更新对象属性，保持响应性
          if (vueItem.start.getTime() !== visItem.start.getTime()) {
            vueItem.start = new Date(visItem.start)
          }
          if (vueItem.end.getTime() !== visItem.end.getTime()) {
            vueItem.end = new Date(visItem.end)
          }
          if (vueItem.content !== visItem.content) {
            vueItem.content = visItem.content
          }
        }
      })
    }

    // 监听数据变化 - 同步Vue数据到vis-timeline
    watch(() => props.items, (newItems, oldItems) => {
      if (visItems.value) {
        console.log('🔄 同步items数据到vis-timeline:', newItems.length)
        
        // 更新vis-timeline数据，保持响应式
        const visData = newItems.map(item => ({
          ...item,
          className: 'transaction-item',
          editable: true
        }))
        
        // 先清空再添加，确保数据同步
        visItems.value.clear()
        visItems.value.add(visData)
        
        // 如果是数据更新而不是初始化，触发约束处理
        if (oldItems && oldItems.length > 0) {
          const changedItemIds = newItems.map(item => item.id)
          emit('item-changed', changedItemIds)
        }
      }
    }, { deep: true })

    watch(() => props.groups, (newGroups) => {
      if (visGroups.value) {
        console.log('🔄 同步groups数据到vis-timeline:', newGroups.length)
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
      // 由于HTML中已经确保vis-timeline加载完成，直接初始化
      initTimeline()
    })

    onBeforeUnmount(() => {
      if (constraintTimeout.value) {
        clearTimeout(constraintTimeout.value)
      }
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