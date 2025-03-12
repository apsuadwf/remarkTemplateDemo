/**
 * 模板变量管理工具
 */

// 预定义的系统变量
export const defaultVariables = [
    {
        name: 'userName',
        label: '用户姓名',
        example: "张三",
        description: "用户的真实姓名",
    },
    {
        name: 'orderNo',
        label: '订单编号',
        example: "ORD202312250001",
        description: "系统生成的订单唯一编号",
    },
    {
        name: 'productName',
        label: '产品名称',
        example: "智能手机 Pro Max",
        description: "产品的完整名称",
    },
    {
        name: 'date',
        label: '日期',
        example: "2023-12-25",
        description: "日期格式：YYYY-MM-DD",
    },
    {
        name: 'amount',
        label: '金额',
        example: "1999.00",
        description: "金额（元），最多保留两位小数",
    }
];

/**
 * 将原始文本中的变量标记转换为HTML标签
 * @param {string} rawText - 原始文本
 * @param {Array} variables - 变量列表
 * @returns {string} - 转换后的HTML
 */
export function convertVariablesToHtml(rawText, variables) {
    if (!rawText || !rawText.trim()) return '';
    
    let html = rawText;
    // 将变量标记 ${xxx} 转换为HTML变量标签
    const varRegex = /\$\{([^}]+)\}/g;
    html = html.replace(varRegex, (match, varName) => {
        // 查找对应的变量标签文本
        const variable = variables.find(v => v.name === varName);
        const label = variable ? variable.label : varName;
        const description = variable ? variable.description : '';
        // 返回HTML变量标签
        return `<span class="variable-tag" contenteditable="false" data-variable="${varName}" data-description="${description}" draggable="true">${label}</span>`;
    });
    
    return html;
}

/**
 * 将HTML中的变量标签转换回原始文本格式
 * @param {HTMLElement} container - 包含HTML的容器
 * @returns {string} - 转换后的原始文本
 */
export function convertHtmlToRawText(container) {
    if (!container) return '';
    
    // 创建临时容器保存当前HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = container.innerHTML;
    
    // 将所有变量标签转换为变量标记
    const variables = tempDiv.querySelectorAll('.variable-tag');
    variables.forEach(varSpan => {
        const varName = varSpan.getAttribute('data-variable');
        // 创建文本节点替换变量标签
        const textNode = document.createTextNode('${' + varName + '}');
        varSpan.parentNode.replaceChild(textNode, varSpan);
    });
    
    // 返回纯文本内容
    return tempDiv.textContent || '';
}

/**
 * 检查原始文本是否包含HTML标签或特殊字符
 * @param {string} text - 要检查的文本
 * @returns {boolean} - 是否包含非法内容
 */
export function checkForInvalidContent(text) {
    if (!text) return false;

    // 检查HTML标签
    const htmlTagRegex = /<[^>]*>/;
    if (htmlTagRegex.test(text)) {
        return true;
    }

    // 检查特殊字符（除了常规标点和变量标记）
    // 排除：字母、数字、中文字符、常规标点和变量标记 ${xxx}
    const safeCharRegex = /^[\u4e00-\u9fa5a-zA-Z0-9\s,.?!;:'"()[\]{}。，、；：''""《》【】\-_${}]+$/;
    return !safeCharRegex.test(text);
}

/**
 * 生成预览内容 - 使用示例值替换变量
 * @param {string} rawContent - 原始文本内容
 * @param {Array} variables - 变量列表
 * @returns {string} - 处理后的预览HTML
 */
export function generatePreviewContent(rawContent, variables) {
    if (!rawContent) return '';
    let content = rawContent;
    const colorMap = new Map();
    
    // 替换所有变量为示例值
    variables.forEach(variable => {
        const regex = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
        const variableValue = variable.example || `[${variable.label}]`;
        
        let hue = null;
        do {
            hue = Math.floor(Math.random() * 360);
        } while (colorMap.has(hue));

        const color = `hsl(${hue}, 70%, 35%)`;
        const underLine = `<u style="color: ${color};border-color: ${color};">${variableValue}</u>`;
        content = content.replace(regex, underLine);
    });
    
    return content;
} 