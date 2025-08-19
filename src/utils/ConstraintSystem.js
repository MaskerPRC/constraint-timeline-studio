// 约束系统类
export default class ConstraintSystem {
    constructor() {
        this.isProcessing = false;
        this.maxIterations = 20;
    }

    processConstraints(items, constraints, changedItemIds = []) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        let iteration = 0;
        let hasChanges = true;

        while (hasChanges && iteration < this.maxIterations) {
            hasChanges = false;
            iteration++;

            // 按约束优先级处理
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
                if (this.applyConstraint(constraint, items)) {
                    hasChanges = true;
                }
            });
        }

        this.isProcessing = false;
        
        if (iteration >= this.maxIterations) {
            console.warn('约束求解达到最大迭代次数，可能存在约束冲突');
        }
        
        return this.validateConstraints(constraints, items);
    }

    applyConstraint(constraint, items) {
        const itemA = items.find(item => item.id === constraint.itemA);
        const itemB = items.find(item => item.id === constraint.itemB);
        
        if (!itemA) return false;
        
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
            item.end = new Date(item.start.getTime() + duration * 60 * 1000);
            return true;
        }
        return false;
    }

    enforceStartAfterEnd(itemA, itemB) {
        if (!itemB || itemA.start >= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        itemA.start = new Date(itemB.end.getTime());
        itemA.end = new Date(itemA.start.getTime() + duration);
        return true;
    }

    enforceStartBeforeStart(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        itemA.start = new Date(itemB.start.getTime() - 60000);
        itemA.end = new Date(itemA.start.getTime() + duration);
        return true;
    }

    enforceStartBeforeEnd(itemA, itemB) {
        if (!itemB || itemA.start <= itemB.end) return false;
        
        const duration = itemA.end - itemA.start;
        itemA.start = new Date(itemB.end.getTime() - 60000);
        itemA.end = new Date(itemA.start.getTime() + duration);
        return true;
    }

    enforceEndBeforeStart(itemA, itemB) {
        if (!itemB || itemA.end <= itemB.start) return false;
        
        const duration = itemA.end - itemA.start;
        itemA.end = new Date(itemB.start.getTime() - 60000);
        itemA.start = new Date(itemA.end.getTime() - duration);
        return true;
    }

    enforceStartOffset(itemA, itemB, offset) {
        if (!itemB) return false;
        
        const targetStart = new Date(itemB.start.getTime() + offset * 60 * 1000);
        if (Math.abs(itemA.start - targetStart) > 60000) {
            const duration = itemA.end - itemA.start;
            itemA.start = targetStart;
            itemA.end = new Date(targetStart.getTime() + duration);
            return true;
        }
        return false;
    }

    enforceStartExact(itemA, itemB, offset) {
        return this.enforceStartOffset(itemA, itemB, offset);
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
}
