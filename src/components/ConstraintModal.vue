<template>
  <div class="modal" style="display: block; z-index: 10000;" @click.self="$emit('cancel')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ constraint ? '编辑约束条件' : '添加约束条件' }}</h3>
        <span class="close" @click="$emit('cancel')">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>约束类型:</label>
            <select v-model="formData.type" required>
              <option value="">请选择约束类型</option>
              <optgroup v-for="(types, group) in groupedConstraintTypes" :key="group" :label="group">
                <option v-for="type in types" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </optgroup>
            </select>
          </div>
          
          <div class="form-group">
            <label>事务A:</label>
            <select v-model="formData.transactionA" required>
              <option value="">请选择事务</option>
              <option v-for="item in items" :key="item.id" :value="item.id">
                {{ item.content }}
              </option>
            </select>
          </div>
          
          <div class="form-group" v-if="needsTransactionB">
            <label>事务B:</label>
            <select v-model="formData.transactionB" :required="needsTransactionB">
              <option value="">请选择事务</option>
              <option v-for="item in items" :key="item.id" :value="item.id">
                {{ item.content }}
              </option>
            </select>
          </div>
          
          <div class="form-group" v-if="needsOffset">
            <label>时间偏移(分钟):</label>
            <input type="number" v-model="formData.offset" min="0" :required="needsOffset">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, onMounted } from 'vue'

export default {
  name: 'ConstraintModal',
  props: {
    constraint: {
      type: Object,
      default: null
    },
    items: {
      type: Array,
      default: () => []
    },
    preselectedItem: {
      type: String,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const formData = reactive({
      type: '',
      transactionA: '',
      transactionB: '',
      offset: 0
    })

    const constraintTypes = [
      { value: 'start-after-end', label: 'A必须在B结束后开始', group: '时间顺序关系' },
      { value: 'start-before-start', label: 'A必须在B开始前开始', group: '时间顺序关系' },
      { value: 'start-before-end', label: 'A必须在B结束前开始', group: '时间顺序关系' },
      { value: 'end-before-start', label: 'A必须在B开始前结束', group: '时间顺序关系' },
      { value: 'start-offset', label: 'A必须在B开始后X分钟开始', group: '时间偏移关系' },
      { value: 'start-exact', label: 'A必须在B开始后精确X分钟开始', group: '时间偏移关系' },
      { value: 'fixed-duration', label: 'A必须持续固定X分钟', group: '时间长度限制' }
    ]

    const needsTransactionB = computed(() => {
      return !['fixed-duration'].includes(formData.type)
    })

    const needsOffset = computed(() => {
      return ['start-offset', 'start-exact', 'fixed-duration'].includes(formData.type)
    })

    const groupedConstraintTypes = computed(() => {
      const groups = {}
      constraintTypes.forEach(type => {
        if (!groups[type.group]) {
          groups[type.group] = []
        }
        groups[type.group].push(type)
      })
      return groups
    })

    const handleSubmit = () => {
      const data = {
        id: props.constraint ? props.constraint.id : 'constraint_' + Date.now(),
        type: formData.type,
        itemA: formData.transactionA,
        itemB: formData.transactionB,
        offset: formData.offset
      }
      emit('save', data)
    }

    onMounted(() => {
      if (props.constraint) {
        formData.type = props.constraint.type
        formData.transactionA = props.constraint.itemA
        formData.transactionB = props.constraint.itemB || ''
        formData.offset = props.constraint.offset || 0
      } else if (props.preselectedItem) {
        formData.transactionA = props.preselectedItem
      }
    })

    return {
      formData,
      needsTransactionB,
      needsOffset,
      groupedConstraintTypes,
      handleSubmit
    }
  }
}
</script>