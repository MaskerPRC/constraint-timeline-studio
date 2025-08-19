<template>
  <div class="container">
    <HeaderComponent 
      @theme-toggle="toggleTheme"
      :current-theme="currentTheme"
    />

    <ControlsComponent 
      @add-transaction="showTransactionModal"
      @add-constraint="showConstraintModal"
      @reset="resetData"
      @time-range-change="updateTimeRange"
      :start-time="timeRange.start"
      :end-time="timeRange.end"
      :time-scale="timeScale"
    />

    <div class="main-content">
      <TimelineComponent
        ref="timelineRef"
        :items="items"
        :groups="groups"
        :constraints="constraints"
        :time-range="timeRange"
        :time-scale="timeScale"
        @item-changed="handleItemChanged"
        @item-double-click="editTransaction"
        @item-context-menu="showContextMenu"
        @timeline-ready="onTimelineReady"
      />
    </div>

    <SidePanelComponent
      :items="items"
      :constraints="constraints"
      :selected-items="selectedItems"
      @edit-transaction="editTransaction"
      @delete-transaction="deleteTransaction"
      @edit-constraint="editConstraint"
      @delete-constraint="deleteConstraint"
    />
  </div>

  <!-- 添加事务模态框 -->
  <TransactionModal
    v-if="showTransactionModalFlag"
    :transaction="editingTransaction"
    @save="saveTransaction"
    @cancel="hideTransactionModal"
  />

  <!-- 添加约束模态框 -->
  <ConstraintModal
    v-if="showConstraintModalFlag"
    :constraint="editingConstraint"
    :items="items"
    :preselected-item="preselectedItem"
    @save="saveConstraint"
    @cancel="hideConstraintModal"
  />

  <!-- 右键上下文菜单 -->
  <ContextMenu
    v-if="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :item-id="contextMenu.itemId"
    @action="handleContextMenuAction"
    @close="hideContextMenu"
  />

  <!-- 颜色选择器 -->
  <ColorPicker
    v-if="colorPicker.show"
    :item-id="colorPicker.itemId"
    @color-selected="handleColorSelected"
    @close="hideColorPicker"
  />
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import HeaderComponent from '@/components/HeaderComponent.vue'
import ControlsComponent from '@/components/ControlsComponent.vue'
import TimelineComponent from '@/components/TimelineComponent.vue'
import SidePanelComponent from '@/components/SidePanelComponent.vue'
import TransactionModal from '@/components/TransactionModal.vue'
import ConstraintModal from '@/components/ConstraintModal.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import ConstraintSystem from '@/utils/ConstraintSystem.js'

export default {
  name: 'App',
  components: {
    HeaderComponent,
    ControlsComponent,
    TimelineComponent,
    SidePanelComponent,
    TransactionModal,
    ConstraintModal,
    ContextMenu,
    ColorPicker
  },
  setup() {
    // 响应式数据
    const items = ref([])
    const groups = ref([])
    const constraints = ref(new Map())
    const selectedItems = ref([])
    const currentTheme = ref('light')
    const timeRange = ref({
      start: new Date(),
      end: new Date()
    })
    const timeScale = ref(30)

    // 模态框状态
    const showTransactionModalFlag = ref(false)
    const showConstraintModalFlag = ref(false)
    const editingTransaction = ref(null)
    const editingConstraint = ref(null)
    const preselectedItem = ref(null)

    // 上下文菜单状态
    const contextMenu = reactive({
      show: false,
      x: 0,
      y: 0,
      itemId: null
    })

    // 颜色选择器状态
    const colorPicker = reactive({
      show: false,
      itemId: null
    })

    // 约束系统
    const constraintSystem = new ConstraintSystem()
    const timelineRef = ref(null)

    // 初始化
    onMounted(() => {
      initializeTheme()
      initializeTimeRange()
      createSampleData()
    })

    // 主题管理
    const initializeTheme = () => {
      const root = document.documentElement
      const savedTheme = localStorage.getItem('trc-theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        currentTheme.value = savedTheme
        root.setAttribute('data-theme', savedTheme)
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        currentTheme.value = 'dark'
        root.setAttribute('data-theme', 'dark')
      }
    }

    const toggleTheme = () => {
      const root = document.documentElement
      const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
      currentTheme.value = newTheme
      root.setAttribute('data-theme', newTheme)
      localStorage.setItem('trc-theme', newTheme)
    }

    // 时间范围初始化
    const initializeTimeRange = () => {
      const now = new Date()
      timeRange.value.start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
      timeRange.value.end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0)
    }

    // 创建示例数据
    const createSampleData = () => {
      console.log('🚀 创建复杂软件开发项目案例 - 5个事务复杂约束网络')
      
      // 创建5个时间轴
      groups.value = [
        { id: 1, content: '📋 需求分析轴' },
        { id: 2, content: '🏗️ 系统设计轴' },
        { id: 3, content: '🎨 前端开发轴' },
        { id: 4, content: '⚙️ 后端开发轴' },
        { id: 5, content: '🧪 测试验收轴' }
      ]

      // 软件开发项目流程 - 5个事务
      const now = new Date()
      const projectStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
      
      items.value = [
        {
          id: 'task_analysis',
          content: '📋 需求分析',
          start: projectStart,
          end: new Date(projectStart.getTime() + 2 * 60 * 60 * 1000), // 2小时
          group: 1,
          style: 'background: linear-gradient(45deg, #E91E63, #C2185B); color: white; border-radius: 8px; border: 2px solid #AD1457; font-weight: bold;'
        },
        {
          id: 'task_design',
          content: '🏗️ 系统设计',
          start: new Date(projectStart.getTime() + 2.25 * 60 * 60 * 1000), // 11:15
          end: new Date(projectStart.getTime() + 3.75 * 60 * 60 * 1000), // 12:45 (1.5小时)
          group: 2,
          style: 'background: linear-gradient(45deg, #3F51B5, #303F9F); color: white; border-radius: 8px; border: 2px solid #1A237E; font-weight: bold;'
        },
        {
          id: 'task_frontend',
          content: '🎨 前端开发',
          start: new Date(projectStart.getTime() + 2.75 * 60 * 60 * 1000), // 11:45
          end: new Date(projectStart.getTime() + 5.75 * 60 * 60 * 1000), // 14:45 (3小时)
          group: 3,
          style: 'background: linear-gradient(45deg, #4CAF50, #388E3C); color: white; border-radius: 8px; border: 2px solid #1B5E20; font-weight: bold;'
        },
        {
          id: 'task_backend',
          content: '⚙️ 后端开发',
          start: new Date(projectStart.getTime() + 3.75 * 60 * 60 * 1000), // 12:45
          end: new Date(projectStart.getTime() + 7.75 * 60 * 60 * 1000), // 16:45 (4小时)
          group: 4,
          style: 'background: linear-gradient(45deg, #FF9800, #F57C00); color: white; border-radius: 8px; border: 2px solid #E65100; font-weight: bold;'
        },
        {
          id: 'task_testing',
          content: '🧪 测试验收',
          start: new Date(projectStart.getTime() + 7.75 * 60 * 60 * 1000), // 16:45
          end: new Date(projectStart.getTime() + 9.75 * 60 * 60 * 1000), // 18:45 (2小时)
          group: 5,
          style: 'background: linear-gradient(45deg, #9C27B0, #7B1FA2); color: white; border-radius: 8px; border: 2px solid #4A148C; font-weight: bold;'
        }
      ]

      // 创建约束关系
      createConstraint({
        id: 'constraint_1',
        type: 'fixed-duration',
        itemA: 'task_analysis',
        offset: 120,
        description: '📋 需求分析必须耗时2小时',
        isValid: true
      })

      createConstraint({
        id: 'constraint_2',
        type: 'start-offset',
        itemA: 'task_design',
        itemB: 'task_analysis',
        offset: 15,
        description: '🏗️ 系统设计必须在需求分析完成15分钟后开始',
        isValid: true
      })

      console.log('✅ 复杂约束网络创建完成！')
    }

    // 约束管理
    const createConstraint = (constraintData) => {
      const constraint = {
        id: constraintData.id || 'constraint_' + Date.now(),
        type: constraintData.type,
        itemA: constraintData.itemA,
        itemB: constraintData.itemB,
        offset: constraintData.offset || 0,
        isValid: true,
        description: constraintData.description || generateConstraintDescription(constraintData)
      }
      constraints.value.set(constraint.id, constraint)
      return constraint
    }

    const generateConstraintDescription = (data) => {
      const itemA = items.value.find(item => item.id === data.itemA)
      const itemB = items.value.find(item => item.id === data.itemB)
      const nameA = itemA ? itemA.content : '事务A'
      const nameB = itemB ? itemB.content : '事务B'

      switch (data.type) {
        case 'start-after-end':
          return `📍 ${nameA} 必须在 ${nameB} 结束后开始`
        case 'start-before-start':
          return `⏰ ${nameA} 必须在 ${nameB} 开始前开始`
        case 'start-before-end':
          return `⏱️ ${nameA} 必须在 ${nameB} 结束前开始`
        case 'end-before-start':
          return `🔚 ${nameA} 必须在 ${nameB} 开始前结束`
        case 'start-offset':
          const offsetText = data.offset >= 0 ? `${data.offset}分钟后` : `${Math.abs(data.offset)}分钟前`
          return `⏲️ ${nameA} 必须在 ${nameB} 开始 ${offsetText} 开始`
        case 'start-exact':
          return `🎯 ${nameA} 必须在 ${nameB} 开始后精确 ${data.offset} 分钟开始`
        case 'fixed-duration':
          return `⏳ ${nameA} 必须持续固定 ${data.offset} 分钟`
        default:
          return '❓ 未知约束类型'
      }
    }

    // 事件处理
    const handleItemChanged = (changedItemIds) => {
      // 处理约束
      const validationResults = constraintSystem.processConstraints(items.value, constraints.value, changedItemIds)
      
      // 更新约束验证状态
      validationResults.forEach((isValid, constraintId) => {
        const constraint = constraints.value.get(constraintId)
        if (constraint) {
          constraint.isValid = isValid
        }
      })
    }

    const showTransactionModal = (itemId = null, time = null) => {
      if (itemId) {
        editingTransaction.value = items.value.find(item => item.id === itemId)
      } else if (time) {
        editingTransaction.value = null
        // 可以在这里设置默认时间
      } else {
        editingTransaction.value = null
      }
      showTransactionModalFlag.value = true
    }

    const hideTransactionModal = () => {
      showTransactionModalFlag.value = false
      editingTransaction.value = null
    }

    const saveTransaction = (transactionData) => {
      if (editingTransaction.value) {
        // 编辑现有事务
        const index = items.value.findIndex(item => item.id === editingTransaction.value.id)
        if (index !== -1) {
          items.value[index] = { ...items.value[index], ...transactionData }
        }
      } else {
        // 添加新事务
        const newItem = {
          ...transactionData,
          group: getNextGroupId(),
          className: 'transaction-item',
          editable: true
        }
        items.value.push(newItem)
        ensureGroup(newItem.group)
      }
      hideTransactionModal()
      handleItemChanged([transactionData.id])
    }

    const showConstraintModal = (constraintId = null, preselectedItemId = null) => {
      if (constraintId) {
        editingConstraint.value = constraints.value.get(constraintId)
      } else {
        editingConstraint.value = null
        preselectedItem.value = preselectedItemId
      }
      showConstraintModalFlag.value = true
    }

    const hideConstraintModal = () => {
      showConstraintModalFlag.value = false
      editingConstraint.value = null
      preselectedItem.value = null
    }

    const saveConstraint = (constraintData) => {
      if (editingConstraint.value) {
        // 编辑现有约束
        const constraint = constraints.value.get(editingConstraint.value.id)
        if (constraint) {
          Object.assign(constraint, constraintData)
          constraint.description = generateConstraintDescription(constraintData)
        }
      } else {
        // 添加新约束
        createConstraint(constraintData)
      }
      hideConstraintModal()
      
      // 处理约束
      const relatedItems = [constraintData.transactionA]
      if (constraintData.transactionB) {
        relatedItems.push(constraintData.transactionB)
      }
      handleItemChanged(relatedItems)
    }

    const editTransaction = (itemId, time = null) => {
      showTransactionModal(itemId, time)
    }

    const deleteTransaction = (itemId) => {
      if (confirm('确定要删除这个事务吗？')) {
        items.value = items.value.filter(item => item.id !== itemId)
        
        // 删除相关约束
        const constraintsToDelete = []
        constraints.value.forEach((constraint, id) => {
          if (constraint.itemA === itemId || constraint.itemB === itemId) {
            constraintsToDelete.push(id)
          }
        })
        
        constraintsToDelete.forEach(id => {
          constraints.value.delete(id)
        })
      }
    }

    const editConstraint = (constraintId) => {
      showConstraintModal(constraintId)
    }

    const deleteConstraint = (constraintId) => {
      if (confirm('确定要删除这个约束吗？')) {
        constraints.value.delete(constraintId)
      }
    }

    const resetData = () => {
      if (confirm('确定要重置所有数据吗？')) {
        items.value = []
        groups.value = []
        constraints.value.clear()
      }
    }

    const updateTimeRange = (newTimeRange) => {
      if (newTimeRange.start >= newTimeRange.end) {
        alert('结束时间必须晚于开始时间')
        return
      }
      timeRange.value.start = newTimeRange.start
      timeRange.value.end = newTimeRange.end
      timeScale.value = newTimeRange.scale
    }

    const showContextMenu = (menuData) => {
      contextMenu.show = true
      contextMenu.x = menuData.x
      contextMenu.y = menuData.y
      contextMenu.itemId = menuData.itemId
    }

    const hideContextMenu = () => {
      contextMenu.show = false
    }

    const handleContextMenuAction = (actionData) => {
      const { action, itemId } = actionData
      
      switch (action) {
        case 'edit':
          editTransaction(itemId)
          break
        case 'duplicate':
          duplicateTransaction(itemId)
          break
        case 'constraint':
          showConstraintModal(null, itemId)
          break
        case 'color':
          showColorPicker(itemId)
          break
        case 'delete':
          deleteTransaction(itemId)
          break
      }
    }

    const duplicateTransaction = (itemId) => {
      const original = items.value.find(item => item.id === itemId)
      if (!original) return

      const newId = 'item_' + Date.now()
      const newItem = {
        ...original,
        id: newId,
        content: original.content + ' (副本)',
        start: new Date(original.end.getTime() + 30 * 60 * 1000),
        end: new Date(original.end.getTime() + (original.end - original.start) + 30 * 60 * 1000)
      }

      items.value.push(newItem)
      
      // 选中新项目
      nextTick(() => {
        if (timelineRef.value) {
          timelineRef.value.setSelection([newId])
        }
      })
    }

    const showColorPicker = (itemId) => {
      colorPicker.show = true
      colorPicker.itemId = itemId
    }

    const hideColorPicker = () => {
      colorPicker.show = false
      colorPicker.itemId = null
    }

    const handleColorSelected = (colorData) => {
      const { itemId, color } = colorData
      const item = items.value.find(item => item.id === itemId)
      if (item) {
        item.style = `background-color: ${color}; color: white; border-radius: 4px;`
      }
    }

    const getNextGroupId = () => {
      return groups.value.length > 0 ? Math.max(...groups.value.map(g => g.id)) + 1 : 1
    }

    const ensureGroup = (groupId) => {
      if (!groups.value.find(g => g.id === groupId)) {
        groups.value.push({
          id: groupId,
          content: `时间轴 ${groupId}`,
          className: 'timeline-group'
        })
      }
    }

    const onTimelineReady = (timeline) => {
      // 时间轴准备就绪时的处理
      timeline.on('select', (properties) => {
        selectedItems.value = properties.items
      })
    }

    return {
      // 数据
      items,
      groups,
      constraints,
      selectedItems,
      currentTheme,
      timeRange,
      timeScale,
      
      // 模态框状态
      showTransactionModalFlag,
      showConstraintModalFlag,
      editingTransaction,
      editingConstraint,
      preselectedItem,
      
      // 菜单状态
      contextMenu,
      colorPicker,
      
      // 引用
      timelineRef,
      
      // 方法
      toggleTheme,
      showTransactionModal,
      hideTransactionModal,
      saveTransaction,
      showConstraintModal,
      hideConstraintModal,
      saveConstraint,
      editTransaction,
      deleteTransaction,
      editConstraint,
      deleteConstraint,
      resetData,
      updateTimeRange,
      handleItemChanged,
      showContextMenu,
      hideContextMenu,
      handleContextMenuAction,
      showColorPicker,
      hideColorPicker,
      handleColorSelected,
      onTimelineReady
    }
  }
}
</script>
