<template>
    <div class="enhanced-editor">
        <h3 class="editor-title">备注模板编辑器</h3>

        <!-- 变量选择区 -->
        <div class="variable-buttons">
            <button
                v-for="varItem in variables"
                :key="varItem.name"
                @click="insertVariable(varItem)"
                class="var-btn"
                :title="`插入${varItem.label}变量`"
            >
                {{ varItem.label }}
            </button>
            <button
                class="var-btn add-btn"
                @click="showAddVariableModal = true"
                title="添加自定义变量"
            >
                <i class="plus-icon">+</i>
            </button>
        </div>

        <!-- 内容编辑区 -->
        <div
            ref="editor"
            class="styled-editor"
            contenteditable="true"
            @input="onEditorInput"
            @keydown="onKeyDown"
            @paste="onPaste"
            @click="setFocusPosition"
            @compositionstart="onCompositionStart"
            @compositionend="onCompositionEnd"
            :placeholder="placeholder"
        ></div>

        <!-- 工具栏 -->
        <div class="editor-toolbar">
            <button @click="clearEditor" class="toolbar-btn">清空</button>
            <button @click="copyContent" class="toolbar-btn">复制</button>
            <button @click="applyRawText" class="toolbar-btn apply-btn" :disabled="hasInvalidContent">应用原文</button>
            <span class="char-count">{{ charCount }} 字符</span>
        </div>

        <!-- 原始文本预览区域 -->
        <div class="raw-text-section">
            <div class="raw-text-header">
                <h4>模板原文</h4>
                <div class="raw-text-actions">
                    <button @click="copyRawText" class="small-btn" title="复制原文">
                        <i class="icon">📋</i>
                    </button>
                    <button @click="toggleRawTextEdit" class="small-btn" title="编辑原文">
                        <i class="icon">✏️</i>
                    </button>
                </div>
            </div>
            <textarea
                v-model="rawContent"
                class="raw-text-preview"
                :readonly="!editingRawText"
                :class="{ 'editing': editingRawText, 'error': hasInvalidContent }"
                placeholder="在此显示模板的原始文本，包含变量标记如${userName}"
                @input="onRawTextInput"
            ></textarea>
            <div v-if="hasInvalidContent" class="error-message">
                <i class="error-icon">⚠️</i> 模板原文中包含HTML标签或特殊字符，这将影响模板解析
            </div>
            <div v-if="editingRawText" class="raw-edit-actions">
                <button @click="cancelRawEdit" class="cancel-raw-btn">取消</button>
                <button @click="applyRawText" class="apply-raw-btn" :disabled="hasInvalidContent">应用更改</button>
            </div>
        </div>
        
        <!-- 预览区域 - 使用示例值替换变量 -->
        <div class="preview-section">
            <div class="preview-header">
                <h4>预览效果</h4>
                <div class="preview-description">使用示例值替换变量的预览效果</div>
            </div>
            <div class="preview-content" v-html="previewContent"></div>
        </div>

        <!-- 隐藏的原始数据存储 -->
        <textarea
            v-model="tempRawContent"
            style="display: none;"
        ></textarea>

        <!-- 添加变量弹窗 (简单实现) -->
        <div v-if="showAddVariableModal" class="modal-overlay">
            <div class="modal-content">
                <h3>添加自定义变量</h3>
                <div class="form-group">
                    <label>变量名称</label>
                    <input v-model="newVariable.name" placeholder="如：productName"/>
                </div>
                <div class="form-group">
                    <label>显示标签</label>
                    <input v-model="newVariable.label" placeholder="如：产品名称"/>
                </div>
                <div class="form-group">
                    <label>示例值</label>
                    <input v-model="newVariable.example" placeholder="如：iPhone 14 Pro Max"/>
                </div>
                <div class="modal-actions">
                    <button @click="addNewVariable" class="primary-btn">添加</button>
                    <button @click="showAddVariableModal = false" class="cancel-btn">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    computed: {
        // 预览内容 - 使用示例值替换变量
        previewContent() {
            if (!this.rawContent) return '';
            let content = this.rawContent;
            const colorMap = new Map();
            // 替换所有变量为示例值
            this.variables.forEach(variable => {
                const regex = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
                const variableValue = variable.example || `[${variable.label}]`;
                // 随机颜色
                // const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
                let hue = null;
                do {
                    hue = Math.floor(Math.random() * 360);
                }while (colorMap.has(hue));

                const color = `hsl(${hue}, 70%, 35%)`;
                const underLine = `<u style="color: ${color};border-color: ${color};">${variableValue}</u>`;
                content = content.replace(regex, underLine);

            });
            
            return content;
        }
    },
    data() {
        return {
            // 内容相关
            rawContent: '', // 存储原始文本内容
            tempRawContent: '', // 临时存储编辑前的原始内容
            lastValidContent: '', // 存储最后一次有效的编辑器内容
            charCount: 0, // 字符计数
            hasInvalidContent: false, // 是否包含非法内容
            
            // 变量相关
            variables: [
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
            ],

            // 新增变量相关
            showAddVariableModal: false, // 是否显示添加变量弹窗
            newVariable: {name: '', label: ''}, // 新变量数据

            // 编辑器状态相关
            placeholder: '在此输入内容，点击上方按钮插入变量...', // 编辑器占位符
            lastCursorPosition: null, // 上次光标位置
            lastSelection: null, // 保存最后一次有效选区
            isComposing: false, // 输入法组合状态跟踪
            lastCompositionTime: 0, // 最后一次输入法组合时间
            compositionCheckTimer: null, // 输入法检查定时器

            // 原始文本编辑状态
            editingRawText: false, // 是否正在编辑原始文本
            editDelay: null // 防抖延迟器
        }
    },
    mounted() {
        // 初始化编辑器内容
        this.syncEditorContent();

        // 设置编辑器占位符
        this.$refs.editor.setAttribute('data-placeholder', this.placeholder);

        // 添加全局事件监听
        document.addEventListener('click', this.captureClick);
        document.addEventListener('selectionchange', this.onSelectionChange);
        
        // 添加额外的事件处理，确保中文输入法能正确触发内容更新
        this.$refs.editor.addEventListener('input', this.checkInputCompletion);
    },
    beforeDestroy() {
        // 移除全局事件监听，防止内存泄漏
        document.removeEventListener('click', this.captureClick);
        document.removeEventListener('selectionchange', this.onSelectionChange);
        
        // 移除额外的事件监听
        if (this.$refs.editor) {
            this.$refs.editor.removeEventListener('input', this.checkInputCompletion);
        }

        // 清除未完成的延迟任务
        if (this.editDelay) {
            clearTimeout(this.editDelay);
        }
        
        // 清除输入法检查定时器
        if (this.compositionCheckTimer) {
            clearTimeout(this.compositionCheckTimer);
        }
    },
    methods: {
        // ===== 原始文本处理相关方法 =====

        // 检查原始文本是否包含HTML标签或特殊字符
        checkForInvalidContent(text) {
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
        },

        // 切换原始文本编辑模式
        toggleRawTextEdit() {
            if (!this.editingRawText) {
                // 进入编辑模式前保存当前内容
                this.tempRawContent = this.rawContent;
            }
            this.editingRawText = !this.editingRawText;

            // 检查内容有效性
            this.hasInvalidContent = this.checkForInvalidContent(this.rawContent);
        },

        // 取消原始文本编辑
        cancelRawEdit() {
            this.rawContent = this.tempRawContent;
            this.editingRawText = false;
            this.hasInvalidContent = this.checkForInvalidContent(this.rawContent);
        },

        // 从原始文本更新编辑器内容
        applyRawText() {
            try {
                // 检查内容有效性
                if (this.hasInvalidContent) {
                    alert('请先移除模板中的HTML标签和特殊字符');
                    return;
                }

                // 检查是否有未完成的输入法组合
                if (this.isComposing) {
                    // 等待输入法完成
                    setTimeout(() => this.applyRawText(), 100);
                    return;
                }

                // 将原始文本转换为带变量标记的HTML
                this.convertRawToEditor();
                this.editingRawText = false;

                // 确保编辑器获得焦点
                this.$refs.editor.focus();
            } catch (e) {
                console.error('应用原始文本失败:', e);
                alert('转换原始文本时出错: ' + e.message);
            }
        },

        // 原始文本输入处理
        onRawTextInput() {
            // 防抖处理，避免频繁验证和转换
            if (this.editDelay) {
                clearTimeout(this.editDelay);
            }

            this.editDelay = setTimeout(() => {
                // 检查内容有效性
                this.hasInvalidContent = this.checkForInvalidContent(this.rawContent);

                // 仅当内容有效且在编辑模式下才进行实时同步
                if (!this.hasInvalidContent && this.editingRawText) {
                    try {
                        this.convertRawToEditor();
                    } catch (e) {
                        console.error('实时同步失败:', e);
                        // 实时同步失败不提示用户，避免打断输入
                    }
                }
            }, 300);
        },

        // 复制原始文本
        copyRawText() {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = this.rawContent;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('原始文本已复制到剪贴板');
            } catch (err) {
                console.error('复制失败:', err);
            }
        },

        // 将原始文本转换为编辑器内容
        convertRawToEditor() {
            if (!this.rawContent.trim()) {
                this.$refs.editor.innerHTML = '';
                return;
            }

            let html = this.rawContent;

            // 将变量标记 ${xxx} 转换为HTML变量标签
            const varRegex = /\$\{([^}]+)\}/g;
            html = html.replace(varRegex, (match, varName) => {
                // 查找对应的变量标签文本
                const variable = this.variables.find(v => v.name === varName);
                const label = variable ? variable.label : varName;
                const description = variable ? variable.description : '';
                // 返回HTML变量标签
                return `<span class="variable-tag" contenteditable="false" data-variable="${varName}" data-description="${description}">${label}</span>`;
            });

            // 应用到编辑器
            this.$refs.editor.innerHTML = html;

            // 保护变量并更新计数
            this.protectVariables();
            this.updateCharCount();
        },

        // 从编辑器获取纯文本
        getRawText() {
            if (!this.$refs.editor) return '';

            // 如果编辑器内容为空，直接返回空字符串
            if (!this.$refs.editor.innerHTML || this.$refs.editor.innerHTML.trim() === '' ||
                this.$refs.editor.innerHTML === '<br>' || this.$refs.editor.innerHTML === '<BR>') {
                return '';
            }

            // 创建临时容器保存当前HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.$refs.editor.innerHTML;

            // 移除所有空的 <br> 标签
            const brElements = tempDiv.querySelectorAll('br');
            brElements.forEach(br => {
                if (br.parentNode === tempDiv && tempDiv.childNodes.length === 1) {
                    br.remove();
                }
            });

            // 替换所有变量标签为变量标记
            let result = tempDiv.innerHTML;
            Array.from(tempDiv.querySelectorAll('.variable-tag')).forEach(el => {
                result = result.replace(el.outerHTML, `\${${el.dataset.variable}}`);
            });

            return result;
        },

        // ===== 变量处理相关方法 =====

        // 插入变量
        insertVariable(varItem) {
            const editor = this.$refs.editor;

            // 首先确保编辑器获得焦点
            editor.focus();

            // 创建变量元素
            const variableHtml = `<span class="variable-tag" contenteditable="false" data-variable="${varItem.name}" data-description="${varItem.description}">${varItem.label}</span>`;

            // 如果正在输入法输入，先完成输入法输入
            if (this.isComposing) {
                // 尝试取消IME输入状态并使用当前内容
                this.isComposing = false;
                // 给浏览器一点时间处理输入法结束
                setTimeout(() => this.doInsertVariable(variableHtml), 10);
                return;
            }

            this.doInsertVariable(variableHtml);
        },

        // 执行变量插入
        doInsertVariable(variableHtml) {
            const editor = this.$refs.editor;
            const selection = window.getSelection();

            // 如果有有效的最后选区，尝试恢复它
            if (this.lastSelection) {
                try {
                    const range = document.createRange();
                    range.setStart(this.lastSelection.startContainer, this.lastSelection.startOffset);
                    range.setEnd(this.lastSelection.endContainer, this.lastSelection.endOffset);

                    selection.removeAllRanges();
                    selection.addRange(range);
                } catch (e) {
                    console.error('恢复选区失败:', e);
                    // 恢复失败时设置到编辑器末尾
                    this.setCaretToEnd(editor);
                }
            } else if (!selection.rangeCount || !editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
                // 如果没有有效选区或选区不在编辑器内，移到末尾
                this.setCaretToEnd(editor);
            }

            // 获取当前选区位置
            const range = selection.getRangeAt(0);

            // 在选区位置创建一个临时标记，用于后续定位
            const tempId = 'temp-marker-' + Date.now();
            const tempMarker = `<span id="${tempId}"></span>`;

            // 插入变量和临时标记
            document.execCommand('insertHTML', false, variableHtml + tempMarker);

            // 找到临时标记并将光标设置到它后面
            const marker = editor.querySelector(`#${tempId}`);
            if (marker) {
                const newRange = document.createRange();
                newRange.setStartAfter(marker);
                newRange.collapse(true);

                // 更新选区
                selection.removeAllRanges();
                selection.addRange(newRange);

                // 移除临时标记
                marker.parentNode.removeChild(marker);
            }

            // 同步和更新
            this.syncRawContent();
            this.protectVariables();
            this.updateCharCount();

            // 检查内容有效性
            this.hasInvalidContent = this.checkForInvalidContent(this.rawContent);

            // 保存新光标位置
            this.saveCaretPosition();

            // 确保编辑器保持焦点
            editor.focus();
        },

        // 保护变量不被修改
        protectVariables() {
            const editor = this.$refs.editor;
            const variables = editor.querySelectorAll('.variable-tag');

            variables.forEach(el => {
                if (el.getAttribute('contenteditable') !== 'false') {
                    el.setAttribute('contenteditable', 'false');
                }
            });
        },

        // 判断是否在变量区域内
        isInsideVariable(node) {
            while (node && node !== this.$refs.editor) {
                if (node.classList && node.classList.contains('variable-tag')) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        },

        // 添加新变量
        addNewVariable() {
            if (this.newVariable.name && this.newVariable.label) {
                // 检查变量名是否已存在
                const exists = this.variables.some(v => v.name === this.newVariable.name);
                if (!exists) {
                    this.variables.push({...this.newVariable});
                    this.newVariable = {name: '', label: ''};
                    this.showAddVariableModal = false;
                }
            }
        },

        // ===== 编辑器交互相关方法 =====

        // 输入法开始组合
        onCompositionStart() {
            this.isComposing = true;
            this.lastCompositionTime = Date.now();
            // 保存组合开始前的光标位置
            this.saveCaretPosition();
        },

        // 输入法组合结束
        onCompositionEnd() {
            this.isComposing = false;
            // 组合结束后重新保存光标位置并同步内容
            setTimeout(() => {
                // 主动同步内容更新
                this.syncRawContent();
                this.protectVariables();
                this.updateCharCount();
                // 保存光标位置
                this.saveCaretPosition();
            }, 10); // 给浏览器一点时间来更新DOM
        },

        // 检查输入完成情况，处理某些情况下compositionend可能未触发的问题
        checkInputCompletion() {
            // 如果正在组合中且上次组合已经超过500ms，可能是组合事件丢失
            if (this.isComposing && (Date.now() - this.lastCompositionTime > 500)) {
                // 清除之前的检查定时器
                if (this.compositionCheckTimer) {
                    clearTimeout(this.compositionCheckTimer);
                }
                
                // 设置一个检查定时器，如果500ms内没有新的组合事件，认为组合已结束
                this.compositionCheckTimer = setTimeout(() => {
                    // 再次检查时间差，确保不是误判
                    if (this.isComposing && (Date.now() - this.lastCompositionTime > 800)) {
                        console.log('检测到可能的输入法组合丢失事件，手动完成组合');
                        this.isComposing = false;
                        // 执行内容同步
                        this.syncRawContent();
                        this.protectVariables();
                        this.updateCharCount();
                        this.saveCaretPosition();
                    }
                }, 300);
            }
            
            // 记录每次输入事件的时间
            this.lastCompositionTime = Date.now();
        },

        // 输入事件处理
        onEditorInput(e) {
            // 检查内容中是否有变量格式 ${...}
            let editorContent = this.$refs.editor.innerHTML;
            console.log('输入事件处理1:', editorContent);
            const varFormatRegex = /\$\{[^}]*\}/g;

            if (editorContent === '<br>'){
                // 删除输入框中的<br>
                this.$refs.editor.innerHTML = '';
                editorContent = '';
            }
            console.log('输入事件处理2:', editorContent);

            if (varFormatRegex.test(editorContent)) {
                // 恢复到之前的内容
                this.$refs.editor.innerHTML = this.lastValidContent || '';
                // 显示提示消息
                alert('请使用上方的变量按钮添加变量，不要直接输入${...}格式');

                // 恢复光标位置
                if (this.lastCursorPosition) {
                    try {
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(this.lastCursorPosition);
                    } catch (e) {
                        console.error('恢复光标位置失败', e);
                    }
                }

                return;
            }

            // 保存有效内容
            this.lastValidContent = this.$refs.editor.innerHTML;

            // 注意：即使在输入法组合时，也保存内容，但不进行同步操作
            // 这样可以确保在组合过程中记录有效内容，组合结束后能正确恢复
            if (!this.isComposing) {
                // 非输入法状态下执行同步操作
                this.syncRawContent();
                this.protectVariables();
                this.updateCharCount();
                // 非输入法状态下保存光标
                this.saveCaretPosition();
            }
        },

        // 键盘事件处理
        onKeyDown(e) {
            const sel = window.getSelection();

            // 检查是否在变量内部
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (this.isInsideVariable(sel.anchorNode)) {
                    e.preventDefault();
                }
            }

            // 检查是否正在尝试输入变量格式 ${
            if (e.key === '{' && e.shiftKey) {
                const text = window.getSelection().toString();
                const beforeText = this.getTextBeforeCursor();

                // 如果前一个字符是$，说明用户正在尝试输入${
                if (beforeText.endsWith('$')) {
                    e.preventDefault();
                    alert('请使用上方的变量按钮添加变量，不要直接输入${...}格式');
                }
            }
        },

        // 获取光标前的文本
        getTextBeforeCursor() {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return '';

            const range = selection.getRangeAt(0).cloneRange();
            range.collapse(true);
            const startNode = this.$refs.editor;

            range.setStart(startNode, 0);
            return range.toString();
        },

        // 粘贴处理
        onPaste(e) {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            document.execCommand('insertText', false, text);
            setTimeout(() => {
                this.updateCharCount();
                this.saveCaretPosition();
                this.syncRawContent();
            }, 0);
        },

        // ===== 光标和选区管理相关方法 =====

        // 选择变化监听
        onSelectionChange() {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            // 检查选区是否在编辑器内
            if (this.$refs.editor && this.$refs.editor.contains(range.commonAncestorContainer)) {
                // 如果不在IME输入状态，保存这个有效选区
                if (!this.isComposing) {
                    this.lastSelection = {
                        startContainer: range.startContainer,
                        startOffset: range.startOffset,
                        endContainer: range.endContainer,
                        endOffset: range.endOffset
                    };
                }
            }
        },

        // 捕获全局点击
        captureClick(e) {
            // 如果点击不在编辑器内，重置选区
            if (this.$refs.editor && !this.$refs.editor.contains(e.target) &&
                !e.target.classList.contains('var-btn')) {
                this.lastSelection = null;
            }
        },

        // 将光标设置到元素末尾
        setCaretToEnd(el) {
            el.focus();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false); // false表示collapse到end
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },

        // 保存光标位置
        saveCaretPosition() {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                // 仅当选区在编辑器内时保存
                if (this.$refs.editor && this.$refs.editor.contains(range.commonAncestorContainer)) {
                    this.lastCursorPosition = range.cloneRange();
                }
            }
        },

        // 保存光标位置
        setFocusPosition() {
            // 点击编辑器时保存选区
            if (!this.isComposing) {
                this.saveCaretPosition();
            }
        },

        // ===== 内容同步和更新相关方法 =====

        // 同步原始内容
        syncRawContent() {
            this.rawContent = this.getRawText();
            // 检查内容有效性
            this.hasInvalidContent = this.checkForInvalidContent(this.rawContent);
        },

        // 同步编辑器内容
        syncEditorContent() {
            if (this.rawContent && this.$refs.editor) {
                // 检查内容有效性
                this.hasInvalidContent = this.checkForInvalidContent(this.rawContent);

                // 仅当内容有效时才应用到编辑器
                if (!this.hasInvalidContent) {
                    this.convertRawToEditor();
                }
            }
        },

        // 更新字符计数
        updateCharCount() {
            // 获取纯文本内容进行计数
            const textContent = this.$refs.editor.textContent || '';
            this.charCount = textContent.length;
        },

        // ===== 工具栏操作相关方法 =====

        // 清空编辑器
        clearEditor() {
            if (confirm('确定要清空编辑器内容吗？')) {
                this.$refs.editor.innerHTML = '';
                this.rawContent = '';
                this.updateCharCount();
                this.hasInvalidContent = false;
            }
        },

        // 复制内容
        copyContent() {
            try {
                // 复制原始内容（含变量标记）
                const textarea = document.createElement('textarea');
                textarea.value = this.rawContent;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('内容已复制到剪贴板');
            } catch (err) {
                console.error('复制失败:', err);
            }
        }
    }
}
</script>

<style>
/* ===== 通用样式 ===== */
.preview-content u {
    text-decoration: none; /* 移除默认下划线 */
    border-bottom: 1px solid; /* 自定义下划线 */
    padding-bottom: 1px; /* 调整间距 */
    display: inline-block; /* 确保边框对齐 */
    line-height: 0.9; /* 控制基线对齐 */
}
/* ===== 整体编辑器容器 ===== */
.enhanced-editor {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 15px;
    background: #fff;
    max-width: 800px;
    margin: 0 auto;
}

.editor-title {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    font-weight: 500;
    font-size: 18px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 10px;
}

/* ===== 变量按钮区域 ===== */
.variable-buttons {
    margin-bottom: 15px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.var-btn {
    padding: 6px 12px;
    background: #409EFF;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.var-btn:hover {
    background: #66b1ff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.add-btn {
    background: #67C23A;
}

.add-btn:hover {
    background: #85ce61;
}

.plus-icon {
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
}

/* ===== 内容编辑区域 ===== */
.styled-editor {
    min-height: 150px;
    max-height: 400px;
    /* overflow-y: auto; */
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 12px;
    line-height: 1.5;
    font-size: 14px;
    white-space: pre-wrap;
    color: #333;
    transition: border-color 0.3s;
    background-color: #fff;
    margin-bottom: 10px;
}

.styled-editor:focus {
    outline: none;
    border-color: #409EFF;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.styled-editor:empty:before {
    content: attr(data-placeholder);
    color: #aaa;
    pointer-events: none;
}

/* 变量标签样式 */
.variable-tag {
    color: #1890ff;
    background-color: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 3px;
    cursor: default;
    user-select: none;
    padding: 0 3px;
    margin: 0 1px;
    display: inline;
    font-size: 13px;
    line-height: normal;
    vertical-align: baseline;
}

.variable-tag:hover {
    position: relative;
}

.variable-tag:hover::after {
    content: attr(data-description);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    margin-bottom: 5px;
}

.variable-tag:hover::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) rotate(180deg);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent rgba(0, 0, 0, 0.75) transparent;
    margin-bottom: -4px;
}

/* ===== 工具栏区域 ===== */
.editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
    margin-bottom: 15px;
}

.toolbar-btn {
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-right: 10px;
    transition: all 0.3s;
}

.toolbar-btn:hover {
    background: #ebeef5;
    color: #409EFF;
}

.toolbar-btn:disabled {
    background: #f5f7fa;
    color: #c0c4cc;
    cursor: not-allowed;
    opacity: 0.7;
}

.add-btn {
    background: #409EFF;
    color: white;
}

.add-btn:hover:not(:disabled) {
    background: #66b1ff;
    color: white;
}

.add-btn:disabled {
    background: #a0cfff;
    color: white;
}

.char-count {
    font-size: 12px;
    color: #909399;
}

/* ===== 原始文本区域 ===== */
.raw-text-section {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #f9f9f9;
    padding: 10px;
    margin-top: 5px;
}

.raw-text-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.raw-text-header h4 {
    margin: 0;
    font-size: 16px;
    color: #606266;
    font-weight: 500;
}

.raw-text-actions {
    display: flex;
    gap: 5px;
}

.small-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
    transition: all 0.2s;
}

.small-btn:hover {
    background: #ecf5ff;
}

.icon {
    font-style: normal;
    font-size: 16px;
}

.raw-text-preview {
    width: 100%;
    min-height: 80px;
    max-height: 200px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 8px 12px;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #606266;
    background-color: #f5f7fa;
    resize: vertical;
    box-sizing: border-box;
    overflow-x: auto;
}

.raw-text-preview.editing {
    background-color: #fff;
    border-color: #409EFF;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.raw-text-preview.error {
    border-color: #f56c6c;
    background-color: #fff;
    box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

.raw-text-preview:focus {
    outline: none;
}

.error-message {
    color: #f56c6c;
    font-size: 13px;
    margin-top: 5px;
    display: flex;
    align-items: center;
}

.error-icon {
    margin-right: 5px;
    font-style: normal;
}

.raw-edit-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    gap: 10px;
}

.cancel-raw-btn {
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.apply-raw-btn {
    background: #409EFF;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.apply-raw-btn:disabled {
    background: #a0cfff;
    cursor: not-allowed;
}

/* ===== 模态框样式 ===== */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: #fff;
    border-radius: 4px;
    padding: 20px;
    width: 400px;
    max-width: 90%;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
    color: #333;
}

.form-group input {
    width: 100%;
    padding: 8px 12px;
    box-sizing: border-box;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: #409EFF;
    box-shadow:
        0 0 0 1px rgba(64,158,255,0.4),   /* 内边框阴影（原0.3→0.4） */
        0 0 0 2px rgba(64,158,255,0.3),   /* 内边框阴影（原0.3→0.4） */
        0 0 12px rgba(64,158,255,0.2),    /* 外层模糊阴影（原8px→12px，0.2→0.3） */
        0 4px 16px rgba(64,158,255,0.15); /* 新增扩散阴影 */
    transition: box-shadow 0.2s ease;
}

/* 悬停预览优化 */
.form-group input:hover:not(:focus) {
    border-color: rgba(64,158,255,0.4);   /* 透明度40% */
    box-shadow:
        0 0 4px rgba(64,158,255,0.25),
        0 2px 6px rgba(64,158,255,0.1);
}

.modal-actions {
    display: flex;
    gap: 25px;
    justify-content: flex-end;
    margin-top: 20px;
}

.primary-btn {
    background: #409EFF;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 10px;
}

.cancel-btn {
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}

/* ===== 预览区域样式 ===== */
.preview-section {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #f9f9f9;
    padding: 10px;
    margin-top: 15px;
}

.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.preview-header h4 {
    margin: 0;
    font-size: 16px;
    color: #606266;
    font-weight: 500;
}

.preview-description {
    font-size: 12px;
    color: #909399;
}

.preview-content {
    background-color: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 12px;
    min-height: 80px;
    max-height: 200px;
    overflow-y: auto;
    line-height: 1.5;
    font-size: 14px;
    color: #333;
}

/* ===== 响应式设计 ===== */
@media (max-width: 768px) {
    .variable-buttons {
        flex-wrap: wrap;
    }

    .var-btn {
        margin-bottom: 8px;
    }

    .styled-editor {
        min-height: 120px;
    }

    .raw-text-preview {
        min-height: 60px;
    }
    
    .preview-content {
        min-height: 60px;
    }
}
</style>