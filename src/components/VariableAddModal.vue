<template>
    <div class="modal-overlay" v-if="visible">
        <div class="modal-content">
            <h3>添加自定义变量</h3>
            <div class="form-group">
                <label>变量名称</label>
                <input 
                    v-model="variableData.name" 
                    placeholder="如：productName"
                    @input="validateName"
                />
                <div v-if="nameError" class="error-text">{{ nameError }}</div>
            </div>
            <div class="form-group">
                <label>显示标签</label>
                <input 
                    v-model="variableData.label" 
                    placeholder="如：产品名称"
                    @input="validateLabel"
                />
                <div v-if="labelError" class="error-text">{{ labelError }}</div>
            </div>
            <div class="form-group">
                <label>示例值</label>
                <input 
                    v-model="variableData.example" 
                    placeholder="如：iPhone 14 Pro Max"
                />
            </div>
            <div class="modal-actions">
                <button 
                    @click="addVariable" 
                    class="primary-btn"
                    :disabled="!isValid"
                >
                    添加
                </button>
                <button @click="$emit('close')" class="cancel-btn">取消</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'VariableAddModal',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        existingVariables: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            variableData: {
                name: '',
                label: '',
                example: ''
            },
            nameError: '',
            labelError: ''
        }
    },
    computed: {
        isValid() {
            return this.variableData.name && 
                  this.variableData.label && 
                  !this.nameError && 
                  !this.labelError;
        }
    },
    methods: {
        validateName() {
            // 验证变量名格式 (只允许字母、数字和下划线)
            const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
            if (!this.variableData.name) {
                this.nameError = '请输入变量名称';
            } else if (!nameRegex.test(this.variableData.name)) {
                this.nameError = '变量名只能包含字母、数字和下划线，且必须以字母开头';
            } else if (this.existingVariables.some(v => v.name === this.variableData.name)) {
                this.nameError = '此变量名已存在';
            } else {
                this.nameError = '';
            }
        },
        validateLabel() {
            if (!this.variableData.label) {
                this.labelError = '请输入显示标签';
            } else if (this.existingVariables.some(v => v.label === this.variableData.label)) {
                this.labelError = '此显示标签已存在';
            } else {
                this.labelError = '';
            }
        },
        addVariable() {
            if (this.isValid) {
                this.$emit('add-variable', { ...this.variableData });
                this.variableData = { name: '', label: '', example: '' };
            }
        }
    }
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    border-radius: 8px;
    padding: 24px;
    width: 90%;
    max-width: 450px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    color: #303133;
}

.form-group {
    margin-bottom: 16px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #606266;
}

input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s;
}

input:focus {
    outline: none;
    border-color: #409EFF;
}

.error-text {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 4px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
}

.primary-btn {
    background-color: #409EFF;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    margin-left: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.primary-btn:disabled {
    background-color: #a0cfff;
    cursor: not-allowed;
}

.cancel-btn {
    background-color: white;
    color: #606266;
    border: 1px solid #dcdfe6;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.cancel-btn:hover {
    color: #409EFF;
    border-color: #c6e2ff;
    background-color: #f0f7ff;
}
</style> 