// 约束系统类 - 修复版本，参考原始代码实现
export default class ConstraintSystem {
    constructor() {
        this.isProcessing = false;
        this.maxIterations = 20;
    }

    processConstraints(items, constraints, changedItemIds = []) {
        if (this.isProcessing) return new Map();
        this.isProcessing = true;

        console.log('🔧 开始约束处理，迭代求解...');
        let iteration = 0;
        let hasChanges = true;

        while (hasChanges && iteration < this.maxIterations) {
            hasChanges = false;
            iteration++;

            // 按约束优先级处理：先处理固定时长，再处理时间关系
            const sortedConstraints = Array.from(constraints.values()).sort((a, b) => {
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
                const beforeState = this.getConstraintState(constraint, items);
                if (this.applyConstraint(constraint, items)) {
                    const afterState = this.getConstraintState(constraint, items);
                    console.log(`约束处理 [${iteration}]: ${constraint.description}`, {
                        before: beforeState,
                        after: afterState
                    });
                    hasChanges = true;
                }
            });
        }

        this.isProcessing = false;
        
        if (iteration >= this.maxIterations) {
            console.warn('约束求解达到最大迭代次数，可能存在约束冲突');
        } else {
            console.log(`✅ 约束求解完成，共进行 ${iteration} 次迭代`);
        }
        
        return this.validateConstraints(constraints, items);
    }

    // 实时约束处理 - 拖拽过程中调用
    processConstraintsRealtime(items, constraints, changedItemIds = []) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        console.log('⚡ 开始实时约束处理，变更项目:', changedItemIds);

        // 实时处理只做少量迭代，保证响应速度
        let iteration = 0;
        let hasChanges = true;
        const maxRealtimeIterations = 3;

        while (hasChanges && iteration < maxRealtimeIterations) {
            hasChanges = false;
            iteration++;

            // 只处理与变更项目相关的约束
            const relevantConstraints = Array.from(constraints.values()).filter(constraint => {
                return changedItemIds.some(itemId => 
                    constraint.itemA === itemId || constraint.itemB === itemId
                );
            });

            console.log(`实时约束处理 [${iteration}]: 找到 ${relevantConstraints.length} 个相关约束`);

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
                if (this.applyConstraintRealtime(constraint, items)) {
                    console.log(`✅ 实时约束生效: ${constraint.description}`);
                    hasChanges = true;
                }
            });
        }

        this.isProcessing = false;
        console.log('⚡ 实时约束处理完成');
    }

    applyConstraint(constraint, items) {
        const itemA = items.find(item => item.id === constraint.itemA);
        const itemB = items.find(item => item.id === constraint.itemB);
        
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

    // 实时约束应用 - 优化版本，更快响应
    applyConstraintRealtime(constraint, items) {
        const itemA = items.find(item => item.id === constraint.itemA);
        const itemB = items.find(item => item.id === constraint.itemB);
        
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

    // 约束执行方法
    enforceFixedDuration(item, duration) {
        const currentDuration = (item.end - item.start) / (1000 * 60);
        if (Math.abs(currentDuration - duration) > 1) {
            const newEnd = new Date(item.start.getTime() + duration * 60 * 1000);
            item.end = newEnd;
            return true;
        }
        return false;
    }

    enforceStartAfterEnd(itemA, itemB) {
        if (!itemB || itemA.start >= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime());
        const newEnd = new Date(newStart.getTime() + duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        return true;
    }

    enforceStartBeforeStart(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.start.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        return true;
    }

    enforceStartBeforeEnd(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        return true;
    }

    enforceEndBeforeStart(itemA, itemB) {
        if (!itemB || itemA.end <= itemB.start) return false;
        
        // 约束：itemA.end <= itemB.start
        // 如果违反了约束，调整itemA的结束时间，保持itemA的时长
        const duration = itemA.end - itemA.start;
        const newEnd = new Date(itemB.start.getTime() - 60000); // 提前1分钟确保满足约束
        const newStart = new Date(newEnd.getTime() - duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        return true;
    }

    enforceStartOffset(itemA, itemB, offset) {
        if (!itemB) return false;
        
        const targetStart = new Date(itemB.start.getTime() + offset * 60 * 1000);
        if (Math.abs(itemA.start - targetStart) > 60000) {
            const duration = itemA.end - itemA.start;
            const newEnd = new Date(targetStart.getTime() + duration);
            
            itemA.start = targetStart;
            itemA.end = newEnd;
            return true;
        }
        return false;
    }

    enforceStartExact(itemA, itemB, offset) {
        return this.enforceStartOffset(itemA, itemB, offset);
    }

    // 实时约束执行方法 - 针对性能优化
    enforceFixedDurationRealtime(item, duration) {
        const currentDuration = (item.end - item.start) / (1000 * 60);
        if (Math.abs(currentDuration - duration) > 1) {
            const newEnd = new Date(item.start.getTime() + duration * 60 * 1000);
            item.end = newEnd;
            return true;
        }
        return false;
    }

    enforceEndBeforeStartRealtime(itemA, itemB) {
        if (!itemB || itemA.end <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        const newEnd = new Date(itemB.start.getTime() - 60000);
        const newStart = new Date(newEnd.getTime() - duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        
        console.log(`实时约束调整: ${itemA.content} 结束时间调整为 ${newEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
        return true;
    }

    enforceStartAfterEndRealtime(itemA, itemB) {
        if (!itemB || itemA.start >= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime() + 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        
        console.log(`实时约束调整: ${itemA.content} 开始时间调整为 ${newStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
        return true;
    }

    enforceStartBeforeStartRealtime(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.start.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        return true;
    }

    enforceStartBeforeEndRealtime(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        const newStart = new Date(itemB.end.getTime() - 60000);
        const newEnd = new Date(newStart.getTime() + duration);
        
        itemA.start = newStart;
        itemA.end = newEnd;
        return true;
    }

    enforceStartOffsetRealtime(itemA, itemB, offset) {
        if (!itemB) return false;
        
        const targetStart = new Date(itemB.start.getTime() + offset * 60 * 1000);
        if (Math.abs(itemA.start - targetStart) > 60000) {
            const duration = itemA.end - itemA.start;
            const newEnd = new Date(targetStart.getTime() + duration);
            
            itemA.start = targetStart;
            itemA.end = newEnd;
            return true;
        }
        return false;
    }

    enforceStartExactRealtime(itemA, itemB, offset) {
        return this.enforceStartOffsetRealtime(itemA, itemB, offset);
    }

    validateConstraints(constraints, items) {
        const results = new Map();
        constraints.forEach((constraint, id) => {
            results.set(id, this.validateConstraint(constraint, items));
        });
        return results;
    }

    validateConstraint(constraint, items) {
        const itemA = items.find(item => item.id === constraint.itemA);
        const itemB = items.find(item => item.id === constraint.itemB);

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

    getConstraintState(constraint, items) {
        const itemA = items.find(item => item.id === constraint.itemA);
        const itemB = items.find(item => item.id === constraint.itemB);
        
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
}