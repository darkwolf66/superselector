# Super Selector

An eval free DOM Super Selector who simplifies the process of Scraping for Chrome Extensions by combining prop access and function executing via string together with the CSS Selector.

This also allows for realtime updates based on DOM changes like in Chrome Extensions who does scraping.

### Install:

```
npm i superselector
```

### How it works:

First import the superselector:

```
const SuperSelector = require('superselector')
```

Then you can use:

```
SuperSelector.superSelector("queryCSS|function()", document)
```

Or you can do like:

const {findElement} = require('superselector')

## Use cases:

### Super Selector Methods:

##### **getProp('propName') or shortcut p('propName')** - Get a property of an element directelly from the string:

```
superSelector("div | getProp('innerText')")
```

##### **recursiveProp('propName', timesToGoRecursive)** - Recursive prop works for cases like parentElement where do you need to find the parent of the parent of the parent of the parent

```
superSelector("div | recursiveProp('parentElement', 3)")
```

##### **propIncludes('propName', 'string')** - Execute an prop.includes('string') on the prop, and return the element if the includes return true

```
superSelector("div | getProp('innerText')")
```

##### **propIncludesLowercase('propName', 'string')** - Execute an prop.includes('string'.toLowerCase()) on the prop, and return the element if the includes return true

```
superSelector("div | getProp('innerText')")
```

# Author

[darkwolf66](https://github.com/darkwolf66)
