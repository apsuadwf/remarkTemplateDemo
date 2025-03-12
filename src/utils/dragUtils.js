/**
 * 拖拽相关工具函数
 */

/**
 * 创建拖拽放置标记
 * @param {HTMLElement} container - 放置容器元素
 * @param {Range} range - 放置位置的选区
 * @returns {HTMLElement} - 创建的标记元素
 */
export function createDropIndicator(container, range) {
    // 移除所有已有的放置标记
    removeAllDropIndicators(container);
    
    // 创建新的放置标记
    const indicator = document.createElement('span');
    indicator.className = 'drop-indicator';
    indicator.contentEditable = 'false';
    
    // 插入放置标记
    range.insertNode(indicator);
    
    return indicator;
}

/**
 * 移除所有放置标记
 * @param {HTMLElement} container - 容器元素
 */
export function removeAllDropIndicators(container) {
    if (!container) return;
    
    const indicators = container.querySelectorAll('.drop-indicator');
    indicators.forEach(indicator => indicator.remove());
}

/**
 * 处理变量元素拖拽开始
 * @param {Event} event - 拖拽事件
 * @param {Object} variable - 变量对象
 */
export function handleVariableDragStart(event, variable) {
    // 设置拖拽数据
    event.dataTransfer.setData('text/plain', JSON.stringify(variable));
    event.dataTransfer.effectAllowed = 'copy';
    
    // 设置拖拽图像（可选）
    if (event.target && event.target.cloneNode) {
        const dragImage = event.target.cloneNode(true);
        dragImage.style.opacity = '0.6';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 10, 10);
        
        // 删除临时元素
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    }
}

/**
 * 处理拖拽项拖放
 * @param {Event} event - 拖放事件
 * @param {HTMLElement} editor - 编辑器元素
 * @param {Function} variableToHtml - 将变量对象转换为HTML的函数
 * @returns {boolean} - 是否成功处理
 */
export function handleVariableDrop(event, editor, variableToHtml) {
    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();
    
    try {
        // 获取拖放数据
        const data = event.dataTransfer.getData('text/plain');
        if (!data) return false;
        
        // 解析变量数据
        const variable = JSON.parse(data);
        
        // 创建变量元素
        const variableHtml = variableToHtml(variable);
        
        // 获取放置位置
        const range = document.caretRangeFromPoint(event.clientX, event.clientY);
        if (!range) return false;
        
        // 移除所有放置标记
        removeAllDropIndicators(editor);
        
        // 创建临时元素作为容器
        const temp = document.createElement('div');
        temp.innerHTML = variableHtml;
        const variableElement = temp.firstChild;
        
        // 插入变量元素
        range.insertNode(variableElement);
        
        // 设置光标位置
        const newRange = document.createRange();
        newRange.setStartAfter(variableElement);
        newRange.collapse(true);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        return true;
    } catch (e) {
        console.error('变量放置失败:', e);
        return false;
    }
}

/**
 * 处理拖拽经过事件
 * @param {Event} event - 拖拽经过事件
 * @param {HTMLElement} editor - 编辑器元素
 */
export function handleDragOver(event, editor) {
    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();
    
    // 设置放置效果
    event.dataTransfer.dropEffect = 'copy';
    
    // 获取当前放置位置
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!range) return;
    
    // 创建放置标记
    createDropIndicator(editor, range);
}

/**
 * 处理拖拽进入事件
 * @param {Event} event - 拖拽进入事件
 * @param {HTMLElement} editor - 编辑器元素
 */
export function handleDragEnter(event, editor) {
    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();
    
    // 添加拖拽状态类
    editor.classList.add('drag-over');
}

/**
 * 处理拖拽离开事件
 * @param {Event} event - 拖拽离开事件
 * @param {HTMLElement} editor - 编辑器元素
 */
export function handleDragLeave(event, editor) {
    // 检查是否真的离开了编辑器
    // 注意：dragLeave在进入子元素时也会触发
    const rect = editor.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        // 确实离开了编辑器
        editor.classList.remove('drag-over');
        removeAllDropIndicators(editor);
    }
} 