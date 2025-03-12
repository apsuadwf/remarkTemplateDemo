<template>
    <div class="variable-selector">
        <!-- 变量选择区 -->
        <div class="variable-buttons">
            <div
                v-for="varItem in variables"
                :key="varItem.name"
                class="var-btn"
                :title="`拖拽${varItem.label}变量至编辑区`"
                draggable="true"
                @dragstart="onDragStart($event, varItem)"
            >
                {{ varItem.label }}
            </div>
            <button
                class="var-btn add-btn"
                @click="$emit('show-add-variable')"
                title="添加自定义变量"
            >
                <i class="plus-icon">+</i>
            </button>
        </div>
        
        <!-- 拖拽提示 -->
        <div class="drag-tip">
            <i class="tip-icon">💡</i> 
            <span>提示：您可以拖拽上方的变量到编辑区，放置后也可以拖拽调整顺序</span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'VariableSelector',
    props: {
        variables: {
            type: Array,
            required: true
        }
    },
    methods: {
        // 变量拖拽开始
        onDragStart(event, variable) {
            // 设置拖拽数据
            event.dataTransfer.setData('text/plain', JSON.stringify(variable));
            event.dataTransfer.effectAllowed = 'copy';
            
            // 通知父组件
            this.$emit('drag-start', variable);
        }
    }
}
</script>

<style scoped>
/* 变量选择器样式 */
.variable-selector {
    margin-bottom: 16px;
}

.variable-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
}

.var-btn {
    background-color: #f0f7ff;
    color: #409EFF;
    border: 1px solid #c6e2ff;
    border-radius: 4px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 13px;
    user-select: none;
    transition: all 0.2s;
}

.var-btn:hover {
    background-color: #ecf5ff;
    border-color: #a0cfff;
}

.add-btn {
    background-color: #f0f7ff;
    color: #409EFF;
    display: flex;
    align-items: center;
    justify-content: center;
}

.plus-icon {
    font-style: normal;
    font-size: 16px;
    font-weight: bold;
}

/* 提示样式 */
.drag-tip {
    background-color: #f0f7ff;
    border-left: 4px solid #409EFF;
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: 0 4px 4px 0;
    font-size: 13px;
    color: #666;
    display: flex;
    align-items: center;
}

.tip-icon {
    margin-right: 8px;
    font-style: normal;
    font-size: 15px;
}
</style> 