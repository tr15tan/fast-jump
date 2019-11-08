# 快速跳转 chrome扩展
![logo](https://github.com/tr15tan/MarkDownPictures/blob/master/fast-jump/develop-bootstrap/1.0.0/fastjump_logo.png)

#### 介绍

保持操作流畅度的chrome扩展，允许你为需要的网页定制自己的快捷键。

![创建快捷键](https://github.com/tr15tan/MarkDownPictures/blob/master/fast-jump/develop-bootstrap/1.0.0/optimized/add_hotkey.gif)

![添加聚焦快捷键](https://github.com/tr15tan/MarkDownPictures/blob/master/fast-jump/develop-bootstrap/1.0.0/optimized/add_hotkey_focus.gif)

![使用导航按钮](https://github.com/tr15tan/MarkDownPictures/blob/master/fast-jump/develop-bootstrap/1.0.0/optimized/nav_button.gif)

![设置界面](https://github.com/tr15tan/MarkDownPictures/blob/master/fast-jump/develop-bootstrap/1.0.0/options_page.png)

#### 安装教程

1. 选择最新release版本，下载zip文件并解压
2. 在chrome的`设置-更多工具-扩展程序`中打开开发者模式，点击`加载已解压的扩展程序`并选择刚才解压出的目录

#### 使用说明

1. 在你需要的网页元素上右键并选择`为此元素添加快捷键`，打开`快速跳转 设置`页面。
2. 在`新增自定义按键：`下的文本框中输入你为该操作定义的名称、需要用到的按键（支持单个任意按键或单个任意按键与`ctrl/shift/alt/command`键的组合）；`可见时生效`选择框选中时代表只有该元素在页面可见时，按下对应的快捷键才会执行操作。下拉菜单中可以选择按下快捷键后完成的操作。点击清除按钮可以清除`操作名称`及`快捷键`文本框中输入的内容。保存按钮将该快捷键的设置保存到此网站的快捷键分组当中。每个网站都可以设置任意个快捷键，但是每个域名下只能有一个同名的快捷键。
3. 所有已保存的快捷键将会按域名分组显示在`快速跳转 设置`页面，点击每行后的`删除`按钮可以清除该快捷键。
4. `向上翻页`/`向下翻页`/`回到顶部`和`去到底部`选择框可以为所有网页添加导航按钮。`删除所有快捷键`可以清除所有保存的快捷键。

#### 问题与反馈

遇到问题或者有疑问及建议可以提交issue，欢迎提交pr。