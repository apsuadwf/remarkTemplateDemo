/**
 * 格式化工具函数
 */

/**
 * 计算文本字符数（不包括HTML标签和空格）
 * @param {string} text - 需要计算字符数的文本
 * @returns {number} - 字符数
 */
export function countChars(text) {
    if (!text) return 0;
    
    // 创建临时div并设置内容
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    
    // 获取纯文本内容
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // 移除空格和特殊字符
    const trimmed = textContent.replace(/\s+/g, '');
    
    return trimmed.length;
}

/**
 * 格式化编辑器内容，移除多余标签和样式
 * @param {string} html - 编辑器HTML内容
 * @returns {string} - 格式化后的HTML
 */
export function formatEditorContent(html) {
    if (!html) return '';
    
    let formatted = html;
    
    // 移除多余空白行
    formatted = formatted.replace(/<(div|p)><br><\/(div|p)>/gi, '<br>');
    formatted = formatted.replace(/<(div|p)><\/(div|p)>/gi, '<br>');
    
    // 移除连续的<br>标签，保留一个
    formatted = formatted.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');
    
    // 移除空格字符
    formatted = formatted.replace(/&nbsp;/g, ' ');
    
    // 移除多余的样式属性
    formatted = formatted.replace(/style="[^"]*"/gi, '');
    
    // 移除空span标签
    formatted = formatted.replace(/<span[^>]*>(\s*)<\/span>/gi, '$1');
    
    // 清理多余的空格
    formatted = formatted.replace(/\s{2,}/g, ' ').trim();
    
    return formatted;
}

/**
 * 从HTML中提取纯文本（不包括HTML标签）
 * @param {string} html - HTML内容
 * @returns {string} - 提取的纯文本
 */
export function extractTextFromHtml(html) {
    if (!html) return '';
    
    // 创建临时div并设置内容
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 获取纯文本内容
    return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * 截断文本到指定长度
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀，默认为'...'
 * @returns {string} - 截断后的文本
 */
export function truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + suffix;
}

/**
 * 格式化变量名（确保符合规范）
 * @param {string} name - 原始变量名
 * @returns {string} - 格式化后的变量名
 */
export function formatVariableName(name) {
    if (!name) return '';
    
    // 移除空格和特殊字符
    let formatted = name.replace(/[^\w]/g, '');
    
    // 确保以字母开头
    if (!/^[a-zA-Z]/.test(formatted)) {
        formatted = 'var' + formatted;
    }
    
    return formatted;
}

/**
 * 对变量标签进行语法高亮
 * @param {string} text - 原始文本
 * @returns {string} - 高亮后的HTML
 */
export function highlightVariableSyntax(text) {
    if (!text) return '';
    
    // 高亮变量标记 ${xxx}
    return text.replace(/(\$\{)([^}]+)(\})/g, 
        '<span style="color:#409EFF">$1</span>' + 
        '<span style="color:#67C23A">$2</span>' + 
        '<span style="color:#409EFF">$3</span>'
    );
} 