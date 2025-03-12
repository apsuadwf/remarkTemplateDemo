<template>
    <div class="enhanced-editor">
        <h3 class="editor-title">备注模板编辑器</h3>

        <!-- 使用变量选择器组件 -->
        <variable-selector 
            :variables="variables"
            @drag-start="onVariableDragStart"
            @show-add-variable="showAddVariableModal = true"
        />

        <!-- 拖拽提示 -->
        <div class="drag-tip">
            <i class="tip-icon">💡</i> 
            <span>提示：您可以拖拽上方的变量到编辑区，放置后也可以拖拽调整顺序</span>
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
            @dragover="onDragOver"
            @drop="onDrop"
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
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

        <!-- 使用变量添加弹窗组件 -->
        <variable-add-modal
            :visible="showAddVariableModal"
            :existing-variables="variables"
            @close="showAddVariableModal = false"
            @add-variable="addVariable"
        />
    </div>
</template>

<script>
import {
    checkForInvalidContent,
    convertHtmlToRawText,
    convertVariablesToHtml,
    defaultVariables,
    generatePreviewContent
} from '@/utils/variables';
import {copyElementContent} from '@/utils/domUtils';
import {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleVariableDrop,
    removeAllDropIndicators
} from '@/utils/dragUtils';
import VariableSelector from '@/components/VariableSelector.vue';
import VariableAddModal from '@/components/VariableAddModal.vue';

export default {
    components: {
        VariableSelector,
        VariableAddModal
    },
    computed: {
        // 预览内容 - 使用示例值替换变量
        previewContent() {
            return generatePreviewContent(this.rawContent, this.variables);
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
            variables: [...defaultVariables],

            // 新增变量相关
            showAddVariableModal: false, // 是否显示添加变量弹窗
            
            // 编辑器状态相关
            placeholder: '在此输入内容，可以从上方拖拽变量至此...', // 编辑器占位符
            lastCursorPosition: null, // 上次光标位置
            lastSelection: null, // 保存最后一次有效选区
            isComposing: false, // 输入法组合状态跟踪
            lastCompositionTime: 0, // 最后一次输入法组合时间
            compositionCheckTimer: null, // 输入法检查定时器

            // 原始文本编辑状态
            editingRawText: false, // 是否正在编辑原始文本

            // 拖拽相关
            globalDraggedElement: null, // 全局拖拽元素引用
            currentDropRange: null, // 当前放置范围
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
        // 防抖函数
        debounce(fn, delay = 300) {
            if (this[`_debounceTimer_${fn.name}`]) {
                clearTimeout(this[`_debounceTimer_${fn.name}`]);
            }
            this[`_debounceTimer_${fn.name}`] = setTimeout(() => {
                fn.apply(this);
            }, delay);
        },
        
        // ===== 原始文本处理相关方法 =====

        // 检查原始文本是否包含HTML标签或特殊字符
        checkForInvalidContent(text) {
            return checkForInvalidContent(text);
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
            this.debounce(() => {
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

            // 转换变量为HTML
            const html = convertVariablesToHtml(this.rawContent, this.variables);
            
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

            return convertHtmlToRawText(this.$refs.editor);
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
            if (!this.$refs.editor) return;
            
            const editor = this.$refs.editor;
            const variables = editor.querySelectorAll('.variable-tag');
            
            variables.forEach(el => {
                // 设置不可编辑
                el.setAttribute('contenteditable', 'false');
                
                // 确保变量可拖拽
                el.setAttribute('draggable', 'true');
                
                try {
                    // 先移除现有监听器以避免重复绑定
                    el.removeEventListener('dragstart', this.handleVariableDragStart);
                    el.removeEventListener('dragend', this.handleVariableDragEnd);
                    
                    // 再添加新的事件监听器
                    el.addEventListener('dragstart', this.handleVariableDragStart);
                    el.addEventListener('dragend', this.handleVariableDragEnd);
                } catch (error) {
                    console.error('变量事件绑定失败:', error);
                    
                    // 回退方法：完全重新创建元素
                    try {
                        const oldElement = el;
                        const newElement = document.createElement('span');
                        
                        // 复制所有属性
                        Array.from(oldElement.attributes).forEach(attr => {
                            newElement.setAttribute(attr.name, attr.value);
                        });
                        
                        // 复制内容
                        newElement.textContent = oldElement.textContent;
                        
                        // 设置必要的属性
                        newElement.classList.add('variable-tag');
                        newElement.setAttribute('contenteditable', 'false');
                        newElement.setAttribute('draggable', 'true');
                        newElement.dataset.variable = oldElement.dataset.variable;
                        if (oldElement.dataset.description) {
                            newElement.dataset.description = oldElement.dataset.description;
                        }
                        
                        // 添加拖拽事件
                        newElement.addEventListener('dragstart', this.handleVariableDragStart);
                        newElement.addEventListener('dragend', this.handleVariableDragEnd);
                        
                        // 替换元素
                        if (oldElement.parentNode) {
                            oldElement.parentNode.replaceChild(newElement, oldElement);
                        }
                    } catch (replaceError) {
                        console.error('重新创建变量元素失败:', replaceError);
                    }
                }
            });
        },

        // 清理事件监听器
        cleanupEventListeners(el) {
            try {
                // 先移除现有监听器
                el.removeEventListener('dragstart', this.handleVariableDragStart);
                el.removeEventListener('dragend', this.handleVariableDragEnd);
                
                // 返回原元素，让后续代码继续工作
                return el;
            } catch (error) {
                console.error('清理事件监听器失败:', error);
                
                // 如果移除失败，尝试克隆替换元素
                try {
                    const oldElement = el;
                    const newElement = oldElement.cloneNode(true);
                    
                    if (oldElement.parentNode) {
                        oldElement.parentNode.replaceChild(newElement, oldElement);
                    }
                    
                    return newElement;
                } catch (cloneError) {
                    console.error('替换元素失败:', cloneError);
                    return el; // 返回原元素，避免空引用
                }
            }
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
        addVariable(variable) {
            // 检查变量名是否已存在
            const exists = this.variables.some(v => v.name === variable.name);
            
            if (!exists) {
                this.variables.push({...variable});
                this.showAddVariableModal = false;
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
            const varFormatRegex = /\$\{[^}]*\}/g;

            if (editorContent === '<br>'){
                // 删除输入框中的<br>
                this.$refs.editor.innerHTML = '';
                editorContent = '';
            }

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
            const newRawContent = this.getRawText();
            
            // 检查内容是否真的变化了
            if (this.rawContent !== newRawContent) {
                this.rawContent = newRawContent;
            }
            
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
            if (copyElementContent(this.$refs.editor)) {
                alert('内容已复制到剪贴板');
            } else {
                alert('复制失败，请手动选择并复制');
            }
        },

        // 拖拽处理
        onDragStart(e, varItem) {
            // 设置变量数据
            const varData = {...varItem, isInEditor: false}; // 标记为编辑器外的变量
            e.dataTransfer.setData('text/plain', JSON.stringify(varData));
            e.dataTransfer.effectAllowed = 'copy';
        },

        // 拖拽经过
        onDragOver(event) {
            handleDragOver(event, this.$refs.editor);
        },

        // 拖拽进入
        onDragEnter(event) {
            handleDragEnter(event, this.$refs.editor);
        },

        // 拖拽离开
        onDragLeave(event) {
            handleDragLeave(event, this.$refs.editor);
        },

        // 拖拽放下
        onDrop(event) {
            event.preventDefault();
            event.stopPropagation();
            
            try {
                const data = event.dataTransfer.getData('text/plain');
                if (!data) return;
                
                const variable = JSON.parse(data);
                
                // 创建变量HTML
                const variableHtml = `<span class="variable-tag" contenteditable="false" data-variable="${variable.name}" data-description="${variable.description || ''}" draggable="true">${variable.label}</span>`;
                
                // 处理放置
                if (handleVariableDrop(event, this.$refs.editor, (v) => {
                    return `<span class="variable-tag" contenteditable="false" data-variable="${v.name}" data-description="${v.description || ''}" draggable="true">${v.label}</span>`;
                })) {
                    // 更新内容
                    this.onEditorInput();
                    
                    // 保护变量
                    this.protectVariables();
                }
                
                // 移除放置标记
                removeAllDropIndicators(this.$refs.editor);
                
                // 移除拖拽状态
                this.$refs.editor.classList.remove('drag-over');
            } catch (e) {
                console.error('放置变量失败:', e);
            }
        },

        // 变量拖拽开始事件处理
        handleVariableDragStart(e) {
            // 设置拖拽数据和效果
            const variableEl = e.target;
            const variableName = variableEl.dataset.variable;
            const variableLabel = variableEl.textContent;
            const variableDesc = variableEl.dataset.description || '';
            
            // 存储变量数据
            const varData = {
                name: variableName,
                label: variableLabel,
                description: variableDesc,
                isInEditor: true // 标记这是编辑器内的变量
            };
            
            try {
                e.dataTransfer.setData('text/plain', JSON.stringify(varData));
                e.dataTransfer.effectAllowed = 'move';
            } catch (error) {
                console.error('设置拖拽数据失败:', error);
            }
            
            // 添加样式
            variableEl.classList.add('dragging');
            
            // 直接使用组件实例存储引用
            this.globalDraggedElement = variableEl;
        },

        // 变量拖拽结束事件处理
        handleVariableDragEnd(e) {
            // 移除拖拽样式
            e.target.classList.remove('dragging');
            
            // 移除所有放置指示器
            const indicators = document.querySelectorAll('.drop-indicator');
            indicators.forEach(indicator => indicator.remove());
            
            // 重置拖拽状态
            this.globalDraggedElement = null;
            
            // 移除编辑器的拖拽样式
            const editor = document.querySelector('.styled-editor');
            if (editor) {
                editor.classList.remove('drag-over');
            }
            
            // 延迟更新原始内容，确保DOM已完全更新
            setTimeout(() => {
                this.syncRawContent();
            }, 50);
        },

        // 变量拖拽开始处理
        onVariableDragStart(variable) {
            this.globalDraggedElement = variable;
        },
    }
}
</script>

<style>
@import '@/assets/styles/editor.css';
</style>