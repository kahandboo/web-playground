import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,jsx}'], plugins: { js }, extends: ['js/recommended'], languageOptions: { globals: globals.browser } },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  pluginReact.configs.flat.recommended,
  {
    rules: {
      'indent': ['error', 2],            
      'quotes': ['error', 'single'],    
      'semi': ['error', 'always'],      
      'no-unused-vars': 'warn',         
      'eqeqeq': 'error',                
      'curly': 'error'                 
    }
  }
]);
