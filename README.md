# DSH LAN Session Header

给 DeepSeek Harness 自定义模型路由的请求添加 `x-opencode-session`。插件通过 DSH 的 `llm-pi-ai/request-headers` 钩子读取当前会话 ID。只有 Provider ID、模型 ID 和 Base URL 全部匹配，且请求带有会话 ID 时，才会设置这个请求头。同一会话的各轮复用同一个 ID。

## 安装

需要 DeepSeek Harness `0.2.2-rc.1` 或兼容的更新版本。

官方桌面版请完全退出应用，用桌面版自带的 `dsh` 执行：

```sh
dsh plugin --profile desktop add github:blance714/dsh-lan-session-header#v0.2.0
```

通过 `dsh web` 启动时，将命令中的 `desktop` 换成 `web`，安装后重启 `dsh web` 进程。自定义 profile 使用实际名称。

## 指定路由

安装后的默认配置为空。重开 DSH，从侧栏进入 **Plugins → dsh-lan-session-header**，在 **Session header route** 里填写 Provider ID、Model ID 和 Base URL，然后点击 **Save route**。保存写入当前 profile，下一次请求使用新值。清空全部三个字段并保存可以暂停注入。

也可以直接编辑当前 profile 的 `cordis.patch.yml`。把下面这一项加入顶层列表。如果已有 `id: lan-session-header`，更新原有项。

```yaml
- id: lan-session-header
  config:
    provider: my-anthropic-proxy
    model: deepseek-v4.1-flash
    endpoint: https://proxy.example.com
```

`provider` 和 `model` 分别填实际的 Provider ID 和模型 ID。`endpoint` 填 Provider 的完整 Base URL，包含协议、非默认端口和已有的路径前缀。如果 Base URL 设为 `https://proxy.example.com`，这里也填该地址。API key 仍在 Provider 凭据里配置。

如果此前填过固定的 `x-opencode-session`，从 Provider 的 `headers` 中删除该条。选择该模型发送消息。要验证会话隔离，在同一个对话里发两次，再另开一个对话发一次。前两次应带相同 ID，第三次应带不同 ID。

## 卸载

退出桌面版，执行 `dsh plugin --profile desktop remove dsh-lan-session-header`，并从 `cordis.patch.yml` 删掉 `lan-session-header` 这一项，再重开应用。

## 本地测试

安装开发所需的 DSH Schema 对等依赖后，运行 `npm test`。
