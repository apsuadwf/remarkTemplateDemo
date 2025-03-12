module.exports = {
    root: true,
    env: {
        node: true,
        es6: true
    },
    extends: [
        'plugin:vue/essential',
        'eslint:recommended'
    ],
    parserOptions: {
        parser: '@babel/eslint-parser',
        requireConfigFile: false,
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    rules: {
        'vue/multi-word-component-names': 'off',
        'no-unused-vars':'off',
        'no-empty':'off',
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
};

