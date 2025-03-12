/**
 * DOM操作相关工具函数
 */

/**
 * 创建并保存选区
 * @param {Node} startNode - 开始节点
 * @param {Number} startOffset - 开始位置
 * @param {Node} endNode - 结束节点
 * @param {Number} endOffset - 结束位置
 * @returns {Range} - 创建的选区
 */
export function createAndSetSelection(startNode, startOffset, endNode, endOffset) {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode || startNode, endOffset || startOffset);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    return range;
}

/**
 * 保存当前选区
 * @returns {Object|null} - 保存的选区信息或null
 */
export function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
    };
}

/**
 * 恢复选区
 * @param {Object} savedSelection - 保存的选区信息
 */
export function restoreSelection(savedSelection) {
    if (!savedSelection) return;

    try {
        const range = document.createRange();
        range.setStart(savedSelection.startContainer, savedSelection.startOffset);
        range.setEnd(savedSelection.endContainer, savedSelection.endOffset);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } catch (e) {
        console.error('恢复选区失败:', e);
    }
}

/**
 * 复制元素内容到剪贴板
 * @param {HTMLElement} element - 要复制内容的元素
 * @returns {Boolean} - 是否复制成功
 */
export function copyElementContent(element) {
    try {
        // 创建临时文本域
        const textarea = document.createElement('textarea');
        textarea.value = element.innerText || element.textContent;
        document.body.appendChild(textarea);
        textarea.select();
        
        // 执行复制命令
        const success = document.execCommand('copy');
        
        // 清理
        document.body.removeChild(textarea);
        return success;
    } catch (err) {
        console.error('复制失败:', err);
        return false;
    }
}

/**
 * 防止冒泡并防止默认行为
 * @param {Event} e - 事件对象
 */
export function stopPropagation(e) {
    e.stopPropagation();
    e.preventDefault();
}

/**
 * 创建并插入元素，并设置属性
 * @param {string} tag - 标签名
 * @param {Object} attributes - 属性对象
 * @param {HTMLElement} parent - 父元素
 * @returns {HTMLElement} - 创建的元素
 */
export function createElement(tag, attributes = {}, parent = null) {
    const element = document.createElement(tag);
    
    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.entries(value).forEach(([prop, val]) => {
                element.style[prop] = val;
            });
        } else if (key === 'text') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // 如果有父元素，添加到父元素
    if (parent) {
        parent.appendChild(element);
    }
    
    return element;
} 