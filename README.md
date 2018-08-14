##  ![NPM version](https://img.shields.io/npm/v/create-node-pack.svg?style=flat)

`create-node-pack`是一个Node.js包/项目自动化生成工具，使用它生成的包/项目内置了Typescript的支持，并自动创建完善的tsconfig配置、tslint配置和启动脚本。

使用`create-node-pack`的cli工具可以方便地创建Node.js的包，只需要关注于包的核心业务逻辑，其他从配置到发布的琐碎事情全部都已经做好。

如果是创建一个Node.js的应用项目，需要稍微更改一下自动生成的`package.json`中的信息即可。

### 如何使用？

`create-node-pack`提供了脚本依赖支持和cli命令支持两种使用方式。
如果你需要将它作为依赖，通过你的程序来进行调用，可以在项目本地安装它。

**推荐先安装yarn**  
[关于Yarn](https://yarnpkg.com/zh-Hans/docs/getting-started)

```bash
$ yarn add create-node-pack
```

使用方法：

```javascript
import PackageGenerator from 'create-node-pack'
// or
const PackageGenerator = require('create-node-pack').default;
```

如果你想使用它的cli功能，通过终端来进行项目生成，则可以在全局安装它。

```bash
$ npm install -g create-node-pack
```

使用方法：

```bash
$ create-node-pack <your package/application name>
```

当使用cli方式时，会在当前目录下创建一个与包/应用同名的文件夹来存放项目文件。

### 项目模板结构

以下为自动生成的项目的基本结构：

```
.
├── README.md					// 项目说明文件
├── build						// 项目构建文件所存放的文件夹
├── node_modules				// 项目依赖文件所存放的文件夹
├── package.json				// 项目配置文件
├── src						// 源文件存放文件夹
│   └── index.ts				// 自动生成的入口文件
├── test						// 测试文件存放文件夹
│   ├── index.spec.ts		// 自动生成的测试文件
│   └── tsconfig.json		// 测试文件的typescript配置
├── tsconfig.json			// 项目的typescript配置
├── tslint.json				// tslint的配置
└── yarn.lock					// yarn的锁
```

### 支持

加入QQ群：348108867 以获得技术支持！❤️
