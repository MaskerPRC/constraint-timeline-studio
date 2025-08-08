// 基于 vis-timeline 的时间区块调整工具

class TimeRangeControlAdvanced {
    constructor() {
        // 数据存储
        this.items = new vis.DataSet();
        this.groups = new vis.DataSet();
        this.constraints = new Map();
        this.timeline = null;
        
        // 配置选项
        this.options = {
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
            snap: function (date, scale, step) {
                // 对齐到15分钟
                var hour = date.getHours();
                var minute = date.getMinutes();
                var alignedMinute = Math.round(minute / 15) * 15;
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, alignedMinute);
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
        };

        // 约束系统
        this.constraintSystem = {
            isProcessing: false,
            maxIterations: 20 // 增加迭代次数确保复杂约束能够收敛
        };

        this.init();
        
        // 拖拽状态记录
        this.dragStartState = {};
        
        // 约束处理定时器
        this.constraintTimeout = null;
        this.movingTimeout = null;
        this.rangeChangeTimeout = null;
        this.hoveredItem = null;
        this.constraintMonitoringInterval = null;
        
        // 记录上次的项目状态，用于检测变化
        this.lastItemStates = new Map();
    }

    init() {
        this.setupTimeline();
        this.setupEventListeners();
        this.setupTimelineEvents();
        this.createSampleData();
        this.updateUI();
        
        // 启动实时约束监控
        this.startRealtimeConstraintMonitoring();
    }

    setupTimeline() {
        const container = document.getElementById('visualization');
        this.timeline = new vis.Timeline(container, this.items, this.groups, this.options);

        // 设置初始时间范围
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
        
        this.timeline.setWindow(start, end);
    }

    setupEventListeners() {
        // 添加事务按钮
        document.getElementById('add-transaction').addEventListener('click', () => {
            this.addNewTransaction();
        });

        // 添加约束按钮
        document.getElementById('add-constraint').addEventListener('click', () => {
            this.showConstraintModal();
        });

        // 重置按钮
        document.getElementById('reset').addEventListener('click', () => {
            this.reset();
        });

        // 时间轴控制按钮
        document.getElementById('fit-timeline').addEventListener('click', () => {
            this.timeline.fit();
        });

        document.getElementById('zoom-in').addEventListener('click', () => {
            this.timeline.zoomIn(0.2);
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.timeline.zoomOut(0.2);
        });

        // 时间范围控制
        document.getElementById('start-time').addEventListener('change', () => {
            this.updateTimeRange();
        });

        document.getElementById('end-time').addEventListener('change', () => {
            this.updateTimeRange();
        });

        // 模态框事件
        this.setupModalEvents();
    }

    setupTimelineEvents() {
        // 使用高频率的changed事件来模拟实时约束
        this.timeline.on('changed', (properties) => {
            if (!this.constraintSystem || this.constraintSystem.isProcessing) return;
            
            if (properties && properties.items && Array.isArray(properties.items) && properties.items.length > 0) {
                // 先快速应用实时约束
                this.processConstraintsRealtime(properties.items);
                // 然后完整处理所有约束
                setTimeout(() => {
                    this.processConstraints(properties.items);
                }, 50);
            }
        });

        // 监听数据变化，实现更实时的约束处理
        this.items.on('update', (event, properties) => {
            if (!this.constraintSystem || this.constraintSystem.isProcessing) return;
            
            // 当数据更新时立即检查约束
            if (properties && properties.items && Array.isArray(properties.items) && properties.items.length > 0) {
                clearTimeout(this.constraintTimeout);
                this.constraintTimeout = setTimeout(() => {
                    this.processConstraintsRealtime(properties.items);
                }, 10); // 10毫秒延迟，确保实时响应
            }
        });

        // 添加鼠标事件监听，实现更实时的约束处理
        this.timeline.on('itemover', (properties) => {
            // 当鼠标悬停在项目上时，准备实时约束处理
            this.hoveredItem = properties.item;
        });

        // 监听时间轴的范围变化（可能由拖拽引起）
        this.timeline.on('rangechange', (properties) => {
            if (this.constraintSystem.isProcessing) return;
            
            // 如果有悬停的项目，检查其约束
            if (this.hoveredItem) {
                clearTimeout(this.rangeChangeTimeout);
                this.rangeChangeTimeout = setTimeout(() => {
                    this.processConstraintsRealtime([this.hoveredItem]);
                }, 20);
            }
        });

        // 双击编辑
        this.timeline.on('doubleClick', (properties) => {
            if (properties.item) {
                this.editTransaction(properties.item);
            } else {
                // 双击空白区域创建新事务
                this.addNewTransactionAtTime(properties.time);
            }
        });

        // 右键菜单
        this.timeline.on('contextmenu', (properties) => {
            properties.event.preventDefault();
            if (properties.item) {
                this.showContextMenu(properties.event, properties.item);
            }
        });

        // 选择变化
        this.timeline.on('select', (properties) => {
            this.updateTransactionsList();
        });
    }

    // 事务管理
    addNewTransaction() {
        const now = new Date();
        const id = 'item_' + Date.now();
        
        const item = {
            id: id,
            content: '新事务',
            start: now,
            end: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2小时后
            group: this.getNextGroupId(),
            className: 'transaction-item',
            editable: true,
            style: `background-color: ${this.getRandomColor()}; color: white; border-radius: 4px;`
        };

        this.items.add(item);
        this.ensureGroup(item.group);
        this.updateUI();
        
        // 自动选中新项目
        this.timeline.setSelection([id]);
    }

    addNewTransactionAtTime(time) {
        const id = 'item_' + Date.now();
        const startTime = new Date(time);
        const endTime = new Date(time.getTime() + 60 * 60 * 1000); // 1小时后
        
        const item = {
            id: id,
            content: '新事务',
            start: startTime,
            end: endTime,
            group: this.getNextGroupId(),
            className: 'transaction-item',
            editable: true,
            style: `background-color: ${this.getRandomColor()}; color: white; border-radius: 4px;`
        };

        this.items.add(item);
        this.ensureGroup(item.group);
        this.updateUI();
        
        // 自动选中并开始编辑
        this.timeline.setSelection([id]);
        setTimeout(() => {
            this.editTransaction(id);
        }, 100);
    }

    getNextGroupId() {
        const existingGroups = this.groups.getIds();
        return existingGroups.length + 1;
    }

    ensureGroup(groupId) {
        if (!this.groups.get(groupId)) {
            this.groups.add({
                id: groupId,
                content: `时间轴 ${groupId}`,
                className: 'timeline-group'
            });
        }
    }

    getRandomColor() {
        const colors = [
            '#3498db', '#e74c3c', '#f39c12', '#2ecc71', 
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    editTransaction(itemId) {
        const item = this.items.get(itemId);
        if (!item) return;

        this.showTransactionModal(item);
    }

    showTransactionModal(item = null) {
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        
        form.reset();
        
        if (item) {
            document.getElementById('transaction-name').value = item.content;
            
            // 提取颜色从样式中
            const bgColor = this.extractBackgroundColor(item.style);
            document.getElementById('transaction-color').value = bgColor;
            
            document.getElementById('transaction-start').value = this.formatDateTimeLocal(item.start);
            document.getElementById('transaction-end').value = this.formatDateTimeLocal(item.end);
            
            form.setAttribute('data-editing', item.id);
        } else {
            form.removeAttribute('data-editing');
            const now = new Date();
            document.getElementById('transaction-start').value = this.formatDateTimeLocal(now);
            document.getElementById('transaction-end').value = this.formatDateTimeLocal(new Date(now.getTime() + 60 * 60 * 1000));
        }
        
        modal.style.display = 'block';
    }

    extractBackgroundColor(style) {
        if (!style) return '#3498db';
        const match = style.match(/background-color:\s*([^;]+)/);
        return match ? match[1].trim() : '#3498db';
    }

    saveTransaction() {
        const form = document.getElementById('transaction-form');
        const formData = new FormData(form);
        const editingId = form.getAttribute('data-editing');

        const data = {
            content: formData.get('name'),
            start: new Date(formData.get('startTime')),
            end: new Date(formData.get('endTime')),
            style: `background-color: ${formData.get('color')}; color: white; border-radius: 4px;`
        };

        if (editingId) {
            this.items.update({
                id: editingId,
                ...data
            });
        } else {
            const id = 'item_' + Date.now();
            this.items.add({
                id: id,
                group: this.getNextGroupId(),
                className: 'transaction-item',
                editable: true,
                ...data
            });
            this.ensureGroup(this.getNextGroupId());
        }

        this.hideTransactionModal();
        this.updateUI();
    }

    // 约束系统
    createConstraint(data) {
        const id = data.id || 'constraint_' + Date.now();
        const constraint = {
            id: id,
            type: data.type,
            itemA: data.transactionA,
            itemB: data.transactionB,
            offset: data.offset || 0,
            isValid: true,
            description: this.generateConstraintDescription(data)
        };

        this.constraints.set(id, constraint);
        this.updateUI();
        return constraint;
    }

    generateConstraintDescription(data) {
        const itemA = this.items.get(data.transactionA);
        const itemB = this.items.get(data.transactionB);
        const nameA = itemA ? itemA.content : '事务A';
        const nameB = itemB ? itemB.content : '事务B';

        switch (data.type) {
            case 'start-after-end':
                return `📍 ${nameA} 必须在 ${nameB} 结束后开始`;
            case 'start-before-start':
                return `⏰ ${nameA} 必须在 ${nameB} 开始前开始`;
            case 'start-before-end':
                return `⏱️ ${nameA} 必须在 ${nameB} 结束前开始`;
            case 'end-before-start':
                return `🔚 ${nameA} 必须在 ${nameB} 开始前结束`;
            case 'start-offset':
                const offsetText = data.offset >= 0 ? `${data.offset}分钟后` : `${Math.abs(data.offset)}分钟前`;
                return `⏲️ ${nameA} 必须在 ${nameB} 开始 ${offsetText} 开始`;
            case 'start-exact':
                return `🎯 ${nameA} 必须在 ${nameB} 开始后精确 ${data.offset} 分钟开始`;
            case 'fixed-duration':
                return `⏳ ${nameA} 必须持续固定 ${data.offset} 分钟`;
            default:
                return '❓ 未知约束类型';
        }
    }

    processConstraints(changedItems) {
        if (this.constraintSystem.isProcessing) return;
        this.constraintSystem.isProcessing = true;

        let iteration = 0;
        let hasChanges = true;

        while (hasChanges && iteration < this.constraintSystem.maxIterations) {
            hasChanges = false;
            iteration++;

            // 按约束优先级处理：先处理固定时长，再处理时间关系
            const sortedConstraints = Array.from(this.constraints.values()).sort((a, b) => {
                const priority = {
                    'fixed-duration': 1,
                    'end-before-start': 2,
                    'start-after-end': 2,
                    'start-before-start': 3,
                    'start-before-end': 3,
                    'start-offset': 4,
                    'start-exact': 4
                };
                return (priority[a.type] || 5) - (priority[b.type] || 5);
            });

            sortedConstraints.forEach(constraint => {
                const beforeState = this.getConstraintState(constraint);
                if (this.applyConstraint(constraint)) {
                    const afterState = this.getConstraintState(constraint);
                    console.log(`约束处理 [${iteration}]: ${constraint.description}`, {
                        before: beforeState,
                        after: afterState
                    });
                    hasChanges = true;
                }
            });
        }

        this.constraintSystem.isProcessing = false;
        
        if (iteration >= this.constraintSystem.maxIterations) {
            console.warn('约束求解达到最大迭代次数，可能存在约束冲突');
        }
        
        this.validateConstraints();
        this.updateUI();
    }

    // 实时约束处理 - 拖拽过程中调用
    processConstraintsRealtime(changedItems) {
        if (this.constraintSystem.isProcessing) return;
        this.constraintSystem.isProcessing = true;

        // 实时处理只做少量迭代，保证响应速度
        let iteration = 0;
        let hasChanges = true;
        const maxRealtimeIterations = 3;

        while (hasChanges && iteration < maxRealtimeIterations) {
            hasChanges = false;
            iteration++;

            // 只处理与变更项目相关的约束
            const relevantConstraints = Array.from(this.constraints.values()).filter(constraint => {
                return changedItems.some(itemId => 
                    constraint.itemA === itemId || constraint.itemB === itemId
                );
            });

            // 按优先级排序
            relevantConstraints.sort((a, b) => {
                const priority = {
                    'fixed-duration': 1,
                    'end-before-start': 2,
                    'start-after-end': 2,
                    'start-before-start': 3,
                    'start-before-end': 3,
                    'start-offset': 4,
                    'start-exact': 4
                };
                return (priority[a.type] || 5) - (priority[b.type] || 5);
            });

            relevantConstraints.forEach(constraint => {
                if (this.applyConstraintRealtime(constraint)) {
                    hasChanges = true;
                }
            });
        }

        this.constraintSystem.isProcessing = false;
    }

    // 实时约束应用 - 优化版本，更快响应
    applyConstraintRealtime(constraint) {
        const itemA = this.items.get(constraint.itemA);
        const itemB = this.items.get(constraint.itemB);
        
        if (!itemA) return false;

        switch (constraint.type) {
            case 'fixed-duration':
                return this.enforceFixedDurationRealtime(itemA, constraint.offset);
            case 'end-before-start':
                return this.enforceEndBeforeStartRealtime(itemA, itemB);
            case 'start-after-end':
                return this.enforceStartAfterEndRealtime(itemA, itemB);
            case 'start-before-start':
                return this.enforceStartBeforeStartRealtime(itemA, itemB);
            case 'start-before-end':
                return this.enforceStartBeforeEndRealtime(itemA, itemB);
            case 'start-offset':
                return this.enforceStartOffsetRealtime(itemA, itemB, constraint.offset);
            case 'start-exact':
                return this.enforceStartExactRealtime(itemA, itemB, constraint.offset);
            default:
                return false;
        }
    }

    // 实时约束执行方法 - 针对性能优化
    enforceFixedDurationRealtime(item, duration) {
        const currentDuration = (item.end - item.start) / (1000 * 60);
        if (Math.abs(currentDuration - duration) > 1) {
            const newEnd = new Date(item.start.getTime() + duration * 60 * 1000);
            this.items.update({
                id: item.id,
                end: newEnd
            });
            return true;
        }
        return false;
    }

    enforceEndBeforeStartRealtime(itemA, itemB) {
        if (!itemB || itemA.end <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        const newEnd = new Date(itemB.start.getTime() - 60000);
        const newStart = new Date(newEnd.getTime() - duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        
        console.log(`实时约束调整: ${itemA.content} 结束时间调整为 ${newEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
        return true;
    }

    enforceStartAfterEndRealtime(itemA, itemB) {
        if (!itemB || itemA.start >= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime() + 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        
        console.log(`实时约束调整: ${itemA.content} 开始时间调整为 ${newStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
        return true;
    }

    enforceStartBeforeStartRealtime(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.start.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        return true;
    }

    enforceStartBeforeEndRealtime(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        return true;
    }

    enforceStartOffsetRealtime(itemA, itemB, offset) {
        if (!itemB) return false;
        
        const targetStart = new Date(itemB.start.getTime() + offset * 60 * 1000);
        if (Math.abs(itemA.start - targetStart) > 60000) {
            const duration = itemA.end - itemA.start;
            const newEnd = new Date(targetStart.getTime() + duration);
            
            this.items.update({
                id: itemA.id,
                start: targetStart,
                end: newEnd
            });
            return true;
        }
        return false;
    }

    enforceStartExactRealtime(itemA, itemB, offset) {
        return this.enforceStartOffsetRealtime(itemA, itemB, offset);
    }

    // 启动实时约束监控
    startRealtimeConstraintMonitoring() {
        // 每50毫秒检查一次约束状态
        this.constraintMonitoringInterval = setInterval(() => {
            if (this.constraintSystem.isProcessing) return;
            
            // 检查所有项目是否有变化
            const changedItems = this.detectItemChanges();
            if (changedItems.length > 0) {
                console.log(`检测到项目变化: ${changedItems.join(', ')}`);
                this.processConstraintsRealtime(changedItems);
            }
        }, 50); // 50毫秒检查，确保实时性
    }

    // 检测项目变化
    detectItemChanges() {
        const changedItems = [];
        const currentItems = this.items.get();
        
        currentItems.forEach(item => {
            const lastState = this.lastItemStates.get(item.id);
            const currentState = {
                start: item.start.getTime(),
                end: item.end.getTime()
            };
            
            if (!lastState || 
                lastState.start !== currentState.start || 
                lastState.end !== currentState.end) {
                changedItems.push(item.id);
                this.lastItemStates.set(item.id, currentState);
            }
        });
        
        return changedItems;
    }

    // 更新项目状态记录
    updateItemStates() {
        if (!this.items || !this.lastItemStates) {
            console.warn('Items or lastItemStates not initialized');
            return;
        }
        
        const items = this.items.get();
        if (!items || !Array.isArray(items)) {
            console.warn('No items to update states for');
            return;
        }
        
        items.forEach(item => {
            if (item && item.id && item.start && item.end) {
                this.lastItemStates.set(item.id, {
                    start: item.start.getTime(),
                    end: item.end.getTime()
                });
            }
        });
    }

    // 停止实时约束监控
    stopRealtimeConstraintMonitoring() {
        if (this.constraintMonitoringInterval) {
            clearInterval(this.constraintMonitoringInterval);
            this.constraintMonitoringInterval = null;
        }
    }

    getConstraintState(constraint) {
        const itemA = this.items.get(constraint.itemA);
        const itemB = this.items.get(constraint.itemB);
        
        if (!itemA) return null;
        
        // 辅助函数：安全地格式化时间
        const formatTime = (dateObj) => {
            if (!dateObj || !(dateObj instanceof Date)) {
                return 'Invalid Date';
            }
            return dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        };
        
        const state = {
            itemA: {
                start: formatTime(itemA.start),
                end: formatTime(itemA.end)
            }
        };
        
        if (itemB) {
            state.itemB = {
                start: formatTime(itemB.start),
                end: formatTime(itemB.end)
            };
        }
        
        return state;
    }

    applyConstraint(constraint) {
        const itemA = this.items.get(constraint.itemA);
        const itemB = this.items.get(constraint.itemB);
        
        if (!itemA) return false;
        
        // 检查itemA的日期对象有效性
        if (!itemA.start || !itemA.end || !(itemA.start instanceof Date) || !(itemA.end instanceof Date)) {
            console.warn('ItemA has invalid date objects:', itemA);
            return false;
        }
        
        // 如果需要itemB，也检查它的日期对象有效性
        if (constraint.type !== 'fixed-duration' && itemB) {
            if (!itemB.start || !itemB.end || !(itemB.start instanceof Date) || !(itemB.end instanceof Date)) {
                console.warn('ItemB has invalid date objects:', itemB);
                return false;
            }
        }

        switch (constraint.type) {
            case 'fixed-duration':
                return this.enforceFixedDuration(itemA, constraint.offset);
            case 'start-after-end':
                return this.enforceStartAfterEnd(itemA, itemB);
            case 'start-before-start':
                return this.enforceStartBeforeStart(itemA, itemB);
            case 'start-before-end':
                return this.enforceStartBeforeEnd(itemA, itemB);
            case 'end-before-start':
                return this.enforceEndBeforeStart(itemA, itemB);
            case 'start-offset':
                return this.enforceStartOffset(itemA, itemB, constraint.offset);
            case 'start-exact':
                return this.enforceStartExact(itemA, itemB, constraint.offset);
            default:
                return false;
        }
    }

    enforceFixedDuration(item, duration) {
        const currentDuration = (item.end - item.start) / (1000 * 60);
        if (Math.abs(currentDuration - duration) > 1) {
            const newEnd = new Date(item.start.getTime() + duration * 60 * 1000);
            this.items.update({
                id: item.id,
                end: newEnd
            });
            return true;
        }
        return false;
    }

    enforceStartAfterEnd(itemA, itemB) {
        if (!itemB || itemA.start >= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime());
        const newEnd = new Date(newStart.getTime() + duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        return true;
    }

    enforceStartBeforeStart(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.start.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        return true;
    }

    enforceStartBeforeEnd(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        return true;
    }

    enforceEndBeforeStart(itemA, itemB) {
        if (!itemB || itemA.end <= itemB.start) return false;
        
        // 约束：itemA.end <= itemB.start
        // 如果违反了约束，调整itemA的结束时间，保持itemA的时长
        const duration = itemA.end - itemA.start;
        const newEnd = new Date(itemB.start.getTime() - 60000); // 提前1分钟确保满足约束
        const newStart = new Date(newEnd.getTime() - duration);
        
        this.items.update({
            id: itemA.id,
            start: newStart,
            end: newEnd
        });
        return true;
    }

    enforceStartOffset(itemA, itemB, offset) {
        if (!itemB) return false;
        
        const targetStart = new Date(itemB.start.getTime() + offset * 60 * 1000);
        if (Math.abs(itemA.start - targetStart) > 60000) {
            const duration = itemA.end - itemA.start;
            const newEnd = new Date(targetStart.getTime() + duration);
            
            this.items.update({
                id: itemA.id,
                start: targetStart,
                end: newEnd
            });
            return true;
        }
        return false;
    }

    enforceStartExact(itemA, itemB, offset) {
        return this.enforceStartOffset(itemA, itemB, offset);
    }

    validateConstraints() {
        this.constraints.forEach(constraint => {
            constraint.isValid = this.validateConstraint(constraint);
        });
    }

    validateConstraint(constraint) {
        const itemA = this.items.get(constraint.itemA);
        const itemB = this.items.get(constraint.itemB);

        if (!itemA) return constraint.type === 'fixed-duration';
        if (constraint.type === 'fixed-duration') {
            const duration = (itemA.end - itemA.start) / (1000 * 60);
            return Math.abs(duration - constraint.offset) < 1;
        }

        if (!itemB) return false;

        switch (constraint.type) {
            case 'start-after-end':
                return itemA.start >= itemB.end;
            case 'start-before-start':
                return itemA.start <= itemB.start;
            case 'start-before-end':
                return itemA.start <= itemB.end;
            case 'end-before-start':
                return itemA.end <= itemB.start;
            case 'start-offset':
                const offsetMs = constraint.offset * 60 * 1000;
                return Math.abs(itemA.start - itemB.start - offsetMs) < 60000;
            case 'start-exact':
                const exactMs = constraint.offset * 60 * 1000;
                return Math.abs(itemA.start - (itemB.start.getTime() + exactMs)) < 60000;
            default:
                return true;
        }
    }

    // UI 更新
    updateUI() {
        this.updateTransactionsList();
        this.updateConstraintsList();
        this.updateTimeRangeControls();
    }

    updateTransactionsList() {
        const list = document.getElementById('transactions-list');
        list.innerHTML = '';

        const items = this.items.get();
        const selectedIds = this.timeline.getSelection();

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'transaction-item';
            if (selectedIds.includes(item.id)) {
                div.classList.add('selected');
            }

            const duration = Math.round((item.end - item.start) / (1000 * 60));
            const color = this.extractBackgroundColor(item.style);

            div.innerHTML = `
                <div class="transaction-color" style="background-color: ${color}"></div>
                <div class="transaction-info">
                    <div class="transaction-name">${item.content}</div>
                    <div class="transaction-time">
                        ${item.start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - 
                        ${item.end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        (${duration}分钟)
                    </div>
                </div>
                <div class="transaction-actions">
                    <button class="edit-btn" data-id="${item.id}">编辑</button>
                    <button class="delete-btn" data-id="${item.id}">删除</button>
                </div>
            `;

            div.querySelector('.edit-btn').addEventListener('click', () => {
                this.editTransaction(item.id);
            });

            div.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteTransaction(item.id);
            });

            list.appendChild(div);
        });
    }

    updateConstraintsList() {
        const list = document.getElementById('constraints-list');
        list.innerHTML = '';

        this.constraints.forEach(constraint => {
            const div = document.createElement('div');
            div.className = 'constraint-item';

            div.innerHTML = `
                <div class="constraint-description">${constraint.description}</div>
                <div class="constraint-status ${constraint.isValid ? 'valid' : 'invalid'}">
                    ${constraint.isValid ? '✓ 满足' : '✗ 不满足'}
                </div>
                <div class="constraint-actions">
                    <button class="edit-btn" data-id="${constraint.id}">编辑</button>
                    <button class="delete-btn" data-id="${constraint.id}">删除</button>
                </div>
            `;

            div.querySelector('.edit-btn').addEventListener('click', () => {
                this.editConstraint(constraint.id);
            });

            div.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteConstraint(constraint.id);
            });

            list.appendChild(div);
        });
    }

    deleteTransaction(itemId) {
        if (confirm('确定要删除这个事务吗？')) {
            this.items.remove(itemId);
            
            // 删除相关约束
            const constraintsToDelete = [];
            this.constraints.forEach(constraint => {
                if (constraint.itemA === itemId || constraint.itemB === itemId) {
                    constraintsToDelete.push(constraint.id);
                }
            });
            
            constraintsToDelete.forEach(id => {
                this.constraints.delete(id);
            });
            
            this.updateUI();
        }
    }

    deleteConstraint(constraintId) {
        if (confirm('确定要删除这个约束吗？')) {
            this.constraints.delete(constraintId);
            this.updateUI();
        }
    }

    // 右键菜单和其他交互
    showContextMenu(event, itemId) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        menu.style.zIndex = 1000;

        menu.innerHTML = `
            <div class="menu-item" data-action="edit">编辑事务</div>
            <div class="menu-item" data-action="duplicate">复制事务</div>
            <div class="menu-item" data-action="constraint">添加约束</div>
            <div class="menu-item" data-action="color">更改颜色</div>
            <div class="menu-item" data-action="delete">删除事务</div>
        `;

        menu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            this.handleContextMenuAction(action, itemId);
            menu.remove();
        });

        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener('click', () => {
                if (menu.parentNode) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
    }

    handleContextMenuAction(action, itemId) {
        switch (action) {
            case 'edit':
                this.editTransaction(itemId);
                break;
            case 'duplicate':
                this.duplicateTransaction(itemId);
                break;
            case 'constraint':
                this.showConstraintModal(null, itemId);
                break;
            case 'color':
                this.showColorPicker(itemId);
                break;
            case 'delete':
                this.deleteTransaction(itemId);
                break;
        }
    }

    duplicateTransaction(itemId) {
        const original = this.items.get(itemId);
        if (!original) return;

        const newId = 'item_' + Date.now();
        const newItem = {
            ...original,
            id: newId,
            content: original.content + ' (副本)',
            start: new Date(original.end.getTime() + 30 * 60 * 1000),
            end: new Date(original.end.getTime() + (original.end - original.start) + 30 * 60 * 1000)
        };

        this.items.add(newItem);
        this.timeline.setSelection([newId]);
        this.updateUI();
    }

    showColorPicker(itemId) {
        const colors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];
        
        const picker = document.createElement('div');
        picker.className = 'color-picker-overlay';
        picker.innerHTML = `
            <div class="color-picker-content">
                <h4>选择颜色</h4>
                <div class="color-options">
                    ${colors.map(color => `
                        <div class="color-option" style="background-color: ${color}" data-color="${color}"></div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary">取消</button>
            </div>
        `;

        picker.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-option')) {
                const newColor = e.target.getAttribute('data-color');
                const item = this.items.get(itemId);
                if (item) {
                    this.items.update({
                        id: itemId,
                        style: `background-color: ${newColor}; color: white; border-radius: 4px;`
                    });
                    this.updateUI();
                }
                picker.remove();
            } else if (e.target.classList.contains('btn')) {
                picker.remove();
            }
        });

        document.body.appendChild(picker);
    }

    // 工具函数和其他方法
    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    updateTimeRange() {
        const startInput = document.getElementById('start-time');
        const endInput = document.getElementById('end-time');
        
        const newStart = new Date(startInput.value);
        const newEnd = new Date(endInput.value);
        
        if (newStart >= newEnd) {
            alert('结束时间必须晚于开始时间');
            return;
        }
        
        this.timeline.setWindow(newStart, newEnd);
    }

    updateTimeRangeControls() {
        const window = this.timeline.getWindow();
        if (window && window.start && window.end) {
            document.getElementById('start-time').value = this.formatDateTimeLocal(window.start);
            document.getElementById('end-time').value = this.formatDateTimeLocal(window.end);
        }
    }

    reset() {
        if (confirm('确定要重置所有数据吗？')) {
            this.items.clear();
            this.groups.clear();
            this.constraints.clear();
            this.updateUI();
        }
    }

    createSampleData() {
        console.log('🚀 创建复杂软件开发项目案例 - 5个事务复杂约束网络');
        
        // === 创建5个时间轴（每个任务独立轴） ===
        this.groups.add([
            { id: 1, content: '📋 需求分析轴' },
            { id: 2, content: '🏗️ 系统设计轴' },
            { id: 3, content: '🎨 前端开发轴' },
            { id: 4, content: '⚙️ 后端开发轴' },
            { id: 5, content: '🧪 测试验收轴' }
        ]);

        // === 软件开发项目流程 - 5个事务 ===
        const now = new Date();
        const projectStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
        
        this.items.add([
            {
                id: 'task_analysis',
                content: '📋 需求分析',
                start: projectStart,
                end: new Date(projectStart.getTime() + 2 * 60 * 60 * 1000), // 2小时
                group: 1,
                className: 'transaction-item',
                style: 'background: linear-gradient(45deg, #E91E63, #C2185B); color: white; border-radius: 8px; border: 2px solid #AD1457; font-weight: bold;'
            },
            {
                id: 'task_design',
                content: '🏗️ 系统设计',
                start: new Date(projectStart.getTime() + 2.25 * 60 * 60 * 1000), // 11:15
                end: new Date(projectStart.getTime() + 3.75 * 60 * 60 * 1000), // 12:45 (1.5小时)
                group: 2,
                className: 'transaction-item',
                style: 'background: linear-gradient(45deg, #3F51B5, #303F9F); color: white; border-radius: 8px; border: 2px solid #1A237E; font-weight: bold;'
            },
            {
                id: 'task_frontend',
                content: '🎨 前端开发',
                start: new Date(projectStart.getTime() + 2.75 * 60 * 60 * 1000), // 11:45
                end: new Date(projectStart.getTime() + 5.75 * 60 * 60 * 1000), // 14:45 (3小时)
                group: 3,
                className: 'transaction-item',
                style: 'background: linear-gradient(45deg, #4CAF50, #388E3C); color: white; border-radius: 8px; border: 2px solid #1B5E20; font-weight: bold;'
            },
            {
                id: 'task_backend',
                content: '⚙️ 后端开发',
                start: new Date(projectStart.getTime() + 3.75 * 60 * 60 * 1000), // 12:45
                end: new Date(projectStart.getTime() + 7.75 * 60 * 60 * 1000), // 16:45 (4小时)
                group: 4,
                className: 'transaction-item',
                style: 'background: linear-gradient(45deg, #FF9800, #F57C00); color: white; border-radius: 8px; border: 2px solid #E65100; font-weight: bold;'
            },
            {
                id: 'task_testing',
                content: '🧪 测试验收',
                start: new Date(projectStart.getTime() + 7.75 * 60 * 60 * 1000), // 16:45
                end: new Date(projectStart.getTime() + 9.75 * 60 * 60 * 1000), // 18:45 (2小时)
                group: 5,
                className: 'transaction-item',
                style: 'background: linear-gradient(45deg, #9C27B0, #7B1FA2); color: white; border-radius: 8px; border: 2px solid #4A148C; font-weight: bold;'
            }
        ]);

        // === 复杂约束关系网络 ===
        console.log('⚙️ 设置复杂约束关系...');

        // 🔒 1. 固定时长约束
        this.createConstraint({
            type: 'fixed-duration',
            transactionA: 'task_analysis',
            offset: 120, // 需求分析固定2小时
            description: '📋 需求分析必须耗时2小时'
        });

        this.createConstraint({
            type: 'fixed-duration', 
            transactionA: 'task_design',
            offset: 90, // 系统设计固定1.5小时
            description: '🏗️ 系统设计必须耗时1.5小时'
        });

        this.createConstraint({
            type: 'fixed-duration',
            transactionA: 'task_frontend', 
            offset: 180, // 前端开发固定3小时
            description: '🎨 前端开发必须耗时3小时'
        });

        this.createConstraint({
            type: 'fixed-duration',
            transactionA: 'task_backend',
            offset: 240, // 后端开发固定4小时  
            description: '⚙️ 后端开发必须耗时4小时'
        });

        this.createConstraint({
            type: 'fixed-duration',
            transactionA: 'task_testing',
            offset: 120, // 测试验收固定2小时
            description: '🧪 测试验收必须耗时2小时'
        });

        // 🔗 2. 顺序依赖约束
        this.createConstraint({
            type: 'start-offset',
            transactionA: 'task_design',
            transactionB: 'task_analysis', 
            offset: 15, // 系统设计必须在需求分析完成15分钟后开始
            description: '🏗️ 系统设计必须在需求分析完成15分钟后开始'
        });

        this.createConstraint({
            type: 'start-offset',
            transactionA: 'task_frontend',
            transactionB: 'task_design',
            offset: 30, // 前端开发必须在系统设计开始30分钟后开始
            description: '🎨 前端开发必须在系统设计开始30分钟后开始'
        });

        this.createConstraint({
            type: 'start-after-end',
            transactionA: 'task_backend', 
            transactionB: 'task_design',
            description: '⚙️ 后端开发必须在系统设计完成后开始'
        });

        // 🚧 3. 并行开发约束 
        this.createConstraint({
            type: 'start-before-end',
            transactionA: 'task_frontend',
            transactionB: 'task_backend', 
            description: '🎨 前端开发必须在后端开发完成前开始（并行开发）'
        });

        // 🎯 4. 最终集成约束
        this.createConstraint({
            type: 'start-after-end',
            transactionA: 'task_testing',
            transactionB: 'task_frontend',
            description: '🧪 测试验收必须在前端开发完成后开始'
        });

        this.createConstraint({
            type: 'start-after-end', 
            transactionA: 'task_testing',
            transactionB: 'task_backend',
            description: '🧪 测试验收必须在后端开发完成后开始'
        });

        // 🕐 5. 时间窗口约束
        this.createConstraint({
            type: 'end-before-start',
            transactionA: 'task_analysis',
            transactionB: 'task_testing',
            description: '📋 需求分析必须在测试验收开始前完成（项目时间窗口）'
        });

        console.log('✅ 复杂约束网络创建完成！共计12个约束关系');
        console.log('🎮 现在您可以拖拽任意任务，观察整个项目网络的实时调整！');

        // 初始化项目状态记录
        this.updateItemStates();
    }

    // 模态框管理
    setupModalEvents() {
        // 事务模态框
        const transactionModal = document.getElementById('transaction-modal');
        const transactionForm = document.getElementById('transaction-form');
        
        transactionModal.querySelector('.close').addEventListener('click', () => {
            this.hideTransactionModal();
        });

        transactionModal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.hideTransactionModal();
        });

        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // 约束模态框
        const constraintModal = document.getElementById('constraint-modal');
        const constraintForm = document.getElementById('constraint-form');
        const constraintType = document.getElementById('constraint-type');

        constraintModal.querySelector('.close').addEventListener('click', () => {
            this.hideConstraintModal();
        });

        constraintModal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.hideConstraintModal();
        });

        constraintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConstraint();
        });

        constraintType.addEventListener('change', () => {
            this.updateConstraintForm();
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === transactionModal) {
                this.hideTransactionModal();
            }
            if (e.target === constraintModal) {
                this.hideConstraintModal();
            }
        });
    }

    hideTransactionModal() {
        document.getElementById('transaction-modal').style.display = 'none';
    }

    showConstraintModal(constraintId = null, preselectedItemId = null) {
        const modal = document.getElementById('constraint-modal');
        const form = document.getElementById('constraint-form');
        
        this.updateTransactionSelects();
        form.reset();
        
        if (constraintId) {
            const constraint = this.constraints.get(constraintId);
            if (constraint) {
                document.getElementById('constraint-type').value = constraint.type;
                document.getElementById('constraint-transaction-a').value = constraint.itemA;
                document.getElementById('constraint-transaction-b').value = constraint.itemB || '';
                document.getElementById('constraint-offset').value = constraint.offset || '';
                form.setAttribute('data-editing', constraintId);
                this.updateConstraintForm();
            }
        } else {
            form.removeAttribute('data-editing');
            if (preselectedItemId) {
                document.getElementById('constraint-transaction-a').value = preselectedItemId;
            }
        }
        
        modal.style.display = 'block';
    }

    hideConstraintModal() {
        document.getElementById('constraint-modal').style.display = 'none';
    }

    updateTransactionSelects() {
        const selectA = document.getElementById('constraint-transaction-a');
        const selectB = document.getElementById('constraint-transaction-b');
        
        selectA.innerHTML = '<option value="">请选择事务</option>';
        selectB.innerHTML = '<option value="">请选择事务</option>';
        
        const items = this.items.get();
        items.forEach(item => {
            const optionA = document.createElement('option');
            optionA.value = item.id;
            optionA.textContent = item.content;
            selectA.appendChild(optionA);
            
            const optionB = document.createElement('option');
            optionB.value = item.id;
            optionB.textContent = item.content;
            selectB.appendChild(optionB);
        });
    }

    updateConstraintForm() {
        const type = document.getElementById('constraint-type').value;
        const transactionBGroup = document.getElementById('transaction-b-group');
        const offsetGroup = document.getElementById('offset-group');
        
        const needsTransactionB = !['fixed-duration'].includes(type);
        const needsOffset = ['start-offset', 'start-exact', 'fixed-duration'].includes(type);
        
        transactionBGroup.style.display = needsTransactionB ? 'block' : 'none';
        offsetGroup.style.display = needsOffset ? 'block' : 'none';
        
        document.getElementById('constraint-transaction-b').required = needsTransactionB;
        document.getElementById('constraint-offset').required = needsOffset;
    }

    saveConstraint() {
        const form = document.getElementById('constraint-form');
        const formData = new FormData(form);
        const editingId = form.getAttribute('data-editing');

        const data = {
            type: formData.get('type'),
            transactionA: formData.get('transactionA'),
            transactionB: formData.get('transactionB'),
            offset: formData.get('offset') ? parseInt(formData.get('offset')) : 0
        };

        if (!data.type || !data.transactionA) {
            alert('请填写完整的约束信息');
            return;
        }

        if (editingId) {
            const constraint = this.constraints.get(editingId);
            if (constraint) {
                Object.assign(constraint, data);
                constraint.description = this.generateConstraintDescription(data);
            }
        } else {
            this.createConstraint(data);
        }

        // 获取相关的事务项ID进行约束处理
        const relatedItems = [data.transactionA];
        if (data.transactionB) {
            relatedItems.push(data.transactionB);
        }
        
        // 确保所有相关事务项存在
        const validItems = relatedItems.filter(itemId => {
            const item = this.items.get(itemId);
            return item && item.start && item.end;
        });
        
        if (validItems.length > 0) {
            this.processConstraints(validItems);
        } else {
            console.warn('No valid items found for constraint processing');
        }
        
        this.hideConstraintModal();
    }

    editConstraint(constraintId) {
        this.showConstraintModal(constraintId);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 主题初始化与切换
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('trc-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        root.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.setAttribute('data-theme', 'dark');
    }

    const toggleBtn = document.getElementById('theme-toggle');
    const syncToggleIcon = () => {
        if (!toggleBtn) return;
        const current = root.getAttribute('data-theme') || 'light';
        toggleBtn.textContent = current === 'dark' ? '☀️' : '🌙';
        toggleBtn.title = current === 'dark' ? '切换到浅色' : '切换到深色';
    };
    syncToggleIcon();
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', current);
            localStorage.setItem('trc-theme', current);
            syncToggleIcon();
        });
    }

    // 初始化应用
    new TimeRangeControlAdvanced();
});