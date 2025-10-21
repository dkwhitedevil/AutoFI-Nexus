# Tailwind CSS IDE Setup Guide

## Issue: "Unknown at rule @tailwind" and "@apply" warnings

These CSS linting errors are common when using Tailwind CSS because standard CSS parsers don't recognize Tailwind-specific directives.

## ✅ Solutions Implemented

### 1. **Stylelint Configuration** (`.stylelintrc.json`)
```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply", 
          "variants",
          "responsive",
          "screen",
          "layer"
        ]
      }
    ]
  }
}
```

### 2. **PostCSS Configuration** (`postcss.config.js`)
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 3. **Inline CSS Comments** (in `src/index.css`)
```css
/* stylelint-disable-next-line at-rule-no-unknown */
@tailwind base;
/* stylelint-disable-next-line at-rule-no-unknown */
@tailwind components;
/* stylelint-disable-next-line at-rule-no-unknown */
@tailwind utilities;
```

## 🔧 VS Code Extensions (Recommended)

Install these VS Code extensions for better Tailwind support:

1. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Autocomplete for Tailwind classes
   - Syntax highlighting
   - Linting and error detection

2. **PostCSS Language Support** (`csstools.postcss`)
   - Better support for PostCSS syntax
   - Recognizes @tailwind and @apply directives

## 📝 Additional IDE Settings

### VS Code Settings (`.vscode/settings.json`)
```json
{
  "css.validate": false,
  "less.validate": false,
  "scss.validate": false,
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

## ✨ Key Points

- **These warnings don't affect functionality** - Tailwind works perfectly
- **PostCSS processes the directives** during build time
- **Stylelint configuration** suppresses the warnings
- **IDE extensions** provide better development experience

## 🚀 Current Status

✅ Stylelint configuration added  
✅ PostCSS properly configured  
✅ Inline comments added to suppress warnings  
✅ Tailwind CSS working correctly  
✅ Theme switching functional  

The application works perfectly despite the IDE warnings!
