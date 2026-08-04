export default {
  project: {
    title: "PCL.N 插件中心"
  },
  admin: {
    workspace: "管理后台",
    refresh: "刷新",
    cancel: "取消",
    confirm: "确认",
    actions: "操作",
    empty: "暂无数据",
    reviews: {
      title: "审核队列",
      description: "领取提交后检查包哈希、Manifest 与发布说明，并记录明确的审核决定。",
      pluginId: "插件 ID",
      version: "版本",
      status: "状态",
      packageHash: "包哈希",
      publisherNotes: "发布者说明",
      submittedAt: "提交时间",
      claim: "领取",
      approve: "通过",
      requestChanges: "要求修改",
      reject: "拒绝",
      closed: "已结束",
      empty: "目前没有审核提交",
      decisionReason: "审核意见",
      decisionReasonHint: "拒绝或要求修改时至少填写 3 个字符",
      confirmPrefix: "确认",
      plugin: "插件",
      approveTitle: "通过审核",
      rejectTitle: "拒绝发布",
      changesTitle: "要求修改",
      decideTitle: "审核",
      claimSuccess: "已领取审核任务",
      claimFailed: "领取失败",
      reasonRequired: "请填写至少 3 个字符的审核意见",
      decideSuccess: "审核决定已保存",
      decideFailed: "审核操作失败"
    },
    publishers: {
      title: "发布者治理",
      description: "验证命名空间，并在出现风险时暂停或恢复发布者组织。所有更改都会写入审计日志。",
      organizations: "发布者组织",
      organization: "组织",
      slug: "Slug",
      status: "状态",
      active: "正常",
      suspended: "已停用",
      createdAt: "创建时间",
      suspend: "暂停",
      restore: "恢复",
      emptyOrgs: "暂无发布者组织",
      namespaces: "命名空间申请",
      namespace: "命名空间",
      verified: "已验证",
      pending: "待验证",
      appliedAt: "申请时间",
      revokeVerification: "撤销验证",
      verify: "验证通过",
      emptyNamespaces: "暂无命名空间申请",
      suspendConfirm: "暂停后该组织不能再执行发布写入，确定继续？",
      restoreConfirm: "确定恢复该发布者组织？",
      statusConfirmTitle: "发布者状态确认",
      orgRestored: "组织已恢复",
      orgSuspended: "组织已暂停",
      orgUpdateFailed: "更新组织状态失败",
      verifyConfirm: "确认组织 {org} 拥有命名空间 {ns}？",
      revokeConfirm: "撤销后将阻止新版本上传，确定继续？",
      namespaceConfirmTitle: "命名空间验证",
      namespaceVerified: "命名空间已验证",
      namespaceRevoked: "命名空间验证已撤销",
      namespaceUpdateFailed: "更新验证状态失败"
    },
    users: {
      title: "用户",
      description: "用户身份来自 Supabase Auth。复制 UUID 后可到「管理员」页任命为 admin / reviewer / auditor。",
      displayName: "显示名称",
      github: "GitHub",
      userId: "用户 UUID",
      firstLogin: "首次登录",
      appointHint: "任命管理员：打开左侧「平台管理 → 管理员」，粘贴用户 UUID 并选择角色。"
    },
    members: {
      title: "管理员",
      description:
        "仅超级管理员可任命或撤销管理员；超级管理员权限不可被撤销、降级或取代。其他管理员可查看列表，不可改成员。",
      appoint: "任命管理员",
      viewOnlyHint: "当前账号不是超级管理员，仅可查看管理员列表，不能任命或撤销。",
      displayName: "显示名称",
      superAdmin: "超级管理员",
      github: "GitHub",
      email: "邮箱",
      role: "角色",
      userId: "用户 UUID",
      appointedAt: "任命时间",
      revoke: "撤销",
      irrevocable: "不可撤销",
      empty: "暂无管理员",
      userIdPlaceholder: "从「用户」页复制 user_id",
      roleAdmin: "管理员 (admin)",
      roleReviewer: "审核员 (reviewer)",
      roleAuditor: "审计员 (auditor)",
      roleAdminShort: "管理员",
      roleReviewerShort: "审核员",
      roleAuditorShort: "审计员",
      appointHint:
        "请先让对方使用 GitHub 登录一次插件中心，再在用户列表中复制其 UUID。超级管理员身份不可通过任命转移。",
      confirmAppoint: "确认任命",
      onlySuperCanAppoint: "仅超级管理员可任命管理员",
      invalidUuid: "请输入有效的用户 UUID",
      appointed: "已任命",
      appointFailed: "任命失败",
      superIrrevocable: "超级管理员不可撤销",
      revokeConfirm: "确定撤销 {name}（{role}）的管理权限？",
      revokeTitle: "撤销管理员",
      revoked: "已撤销",
      revokeFailed: "撤销失败",
      loadFailed: "加载失败"
    },
    announcements: {
      title: "启动器公告",
      description: "发布后由桌面端启动时拉取。支持多语言 Markdown、渠道/平台过滤与版本范围。",
      publish: "发布公告",
      id: "ID",
      headline: "标题",
      severity: "级别",
      status: "状态",
      enabled: "已启用",
      disabled: "已停用",
      enable: "启用",
      disable: "停用",
      priority: "优先级",
      starts: "开始",
      ends: "结束",
      indefinite: "无限期",
      edit: "编辑",
      remove: "删除",
      empty: "暂无公告",
      editTitle: "编辑公告",
      createTitle: "发布公告",
      save: "保存",
      announcementId: "公告 ID",
      severityInfo: "普通 (info)",
      severityImportant: "重要 (important)",
      severitySecurity: "安全 (security)",
      severityInfoShort: "普通",
      severityImportantShort: "重要",
      severitySecurityShort: "安全",
      dismissible: "可关闭",
      startsAt: "开始时间",
      endsAt: "结束时间（可选）",
      minVersion: "最低版本（可选）",
      maxVersion: "最高版本（不含，可选）",
      channels: "渠道过滤（逗号分隔，空=全部）",
      platforms: "平台过滤（逗号分隔，空=全部）",
      zhContent: "中文内容 (zh-CN)",
      enContent: "英文内容 (en-US，可选)",
      bodyMd: "正文 Markdown",
      primaryLabel: "主按钮文案",
      actionLabel: "操作按钮文案",
      actionUrl: "操作链接",
      loadFailed: "加载失败",
      saved: "已保存",
      saveFailed: "保存失败",
      deleteConfirm: "确定删除公告 {id}？",
      deleted: "已删除",
      deleteFailed: "删除失败",
      enabledOk: "已启用",
      disabledOk: "已停用",
      toggleFailed: "更新状态失败"
    },
    withdrawals: {
      title: "提现审核",
      description: "核对支付宝掩码与金额，转账后再标记已支付。",
      organization: "组织",
      amount: "金额",
      payoutAccount: "支付账号",
      status: "状态",
      approve: "批准",
      reject: "驳回",
      markPaid: "标记已转账",
      rejectReason: "请输入驳回原因",
      dialogTitle: "提现审核",
      updated: "状态已更新"
    },
    status: {
      pending: "待处理",
      in_review: "审核中",
      approved: "已通过",
      rejected: "已拒绝",
      changes_requested: "需修改",
      paid: "已支付",
      cancelled: "已取消"
    },
    tableEmpty: "当前权限范围内暂无数据"
  },
  login: {
    badge: "PCL.N 插件平台",
    heroTitle: "让插件发布、审核与分发<br />进入同一条可信链路",
    heroSubtitle: "发布者工作台与平台管理端共用统一身份、审计记录和安全扫描结果。",
    featureAuth: "GitHub OAuth 单点登录",
    featureRls: "发布者与管理员数据隔离",
    featureScanner: "独立进程执行包安全检查",
    title: "PCL.N 插件中心",
    copy: "使用 GitHub 身份进入发布者工作台。管理员权限由数据库成员关系单独授予。",
    legalPrefix: "我已阅读并同意",
    terms: "《用户服务协议》",
    and: "和",
    privacy: "《隐私保护协议》",
    legalHint: "首次注册 / 登录 N Cloud 前须确认。协议版本 {version}。",
    github: "使用 GitHub 登录",
    microsoft: "使用 Microsoft 登录",
    securityNote: "前端仅使用 Supabase Publishable Key；管理写入由受保护 API 完成。",
    market: "浏览插件市场",
    docs: "插件开发文档",
    opensource: "查看开源管理端",
    cancel: "取消",
    accountExistsTitle: "账户已存在",
    accountExistsBody:
      "该邮箱已属于另一个 PCL N 在线服务账户。是否登录原账户，然后绑定刚才选择的登录方式？",
    accountExistsConfirm: "登录原账户并绑定",
    useOriginalAccount: "请使用原账户登录。登录后将在账户页确认绑定。",
    noDuplicateAccount: "未创建重复账户。你可以使用原账户登录后再绑定此登录方式。",
    acceptLegalFirst: "请先勾选同意用户服务协议与隐私保护协议，再继续登录。",
    acceptLegalWarn: "请先阅读并勾选同意用户服务协议与隐私保护协议",
    restoreFailed: "无法恢复登录会话"
  },
  authCallback: {
    completing: "正在完成登录…",
    success: "登录成功，正在进入…",
    invalid: "登录回跳无效，请重新登录。",
    failed: "登录回跳失败"
  },
  market: {
    header: {
      brand: "PCL N",
      navigation: "网站导航",
      home: "主页",
      plugins: "插件市场",
      download: "下载",
      docs: "开发文档",
      dashboard: "开发者工作台",
      signIn: "登录",
      switchLanguage: "切换为英文",
      switchTheme: "切换亮色、暗色或跟随系统主题"
    },
    home: {
      badge: "由 PCL N 启动器原生验证",
      title: "让启动器拥有更多可能",
      subtitle: "发现经过审核与签名的 PCL N 插件。网页用于浏览与授权，安装、更新和验签全部由启动器完成。",
      signatureTitle: "市场签名",
      signatureText: "分发版本由插件中心签名",
      nativeTitle: "原生体验",
      nativeText: "界面与启动器风格保持一致",
      updateTitle: "安全更新",
      updateText: "版本递增、可回退、可撤销",
      discover: "浏览插件",
      searchPlaceholder: "搜索插件名称、ID 或标签",
      allCategories: "全部分类",
      search: "搜索",
      categories: "插件分类",
      all: "全部插件",
      resultCount: "找到 {count} 个插件",
      free: "免费",
      noSummary: "开发者暂未提供简介。",
      version: "版本 {version}",
      details: "查看详情",
      emptyTitle: "没有找到插件",
      emptyDescription: "换一个关键词或分类再试试。",
      loadFailed: "插件市场加载失败"
    },
    detail: {
      back: "返回插件市场",
      loading: "正在加载插件信息",
      errorTitle: "无法加载插件",
      overview: "插件介绍",
      tags: "标签",
      pluginId: "插件 ID",
      latestVersion: "最新版本",
      publisher: "发布者",
      permissions: "权限",
      noPermissions: "无额外权限",
      noDescription: "开发者暂未提供详细介绍。",
      free: "免费",
      actionLoading: "加载中",
      getInLauncher: "在启动器中获取",
      owned: "已拥有 · 在启动器中获取",
      purchase: "购买 / 验证订单",
      freeHint: "免费插件无需交易记录，可直接在 PCL N 启动器中获取。",
      ownedHint: "已获得永久授权，请在启动器中完成安装与市场验签。",
      purchaseHint: "一次购买，永久授权；完成授权后回到启动器获取。",
      launcherHint: "打开 PCL N → 插件 → 市场 → 搜索“{name}”→ 获取。安装包仅在启动器内下载并验签。",
      copied: "已复制插件 ID：{id}",
      openHint: "请在 PCL N 启动器的插件市场中搜索并获取；浏览器也会尝试打开已安装的启动器。",
      policyTitle: "数字内容与安装说明",
      policy: "订单兑换后视为数字内容永久授权已交付，除欺诈、重复扣款或法律强制规定外不支持退款。网页仅提供浏览与授权，插件安装和市场验签在 PCL N 启动器内完成。",
      redeemTitle: "验证爱发电订单",
      redeemNotice: "请先在平台爱发电主页自选金额赞助，金额不得低于插件价格。每个订单只能兑换一次。",
      orderNumber: "爱发电订单号",
      orderPlaceholder: "请输入订单号",
      extraAmount: "超额金额用于",
      publisherSupport: "赞助发布者（仍按 10% / 90% 分成）",
      platformSupport: "赞助平台",
      cancel: "取消",
      verify: "验证并授权",
      orderRequired: "请输入订单号",
      redeemSuccess: "订单验证成功，已获得永久授权。请打开 PCL N 启动器完成获取。",
      redeemFailed: "订单验证失败",
      loadFailed: "插件信息加载失败"
    },
    categories: {
      compatibility: "兼容性",
      management: "管理工具",
      ui: "界面扩展",
      tools: "实用工具",
      utility: "实用工具",
      integration: "集成服务",
      theme: "主题美化",
      developer: "开发工具",
      gameplay: "游戏增强"
    }
  },
  site: {
    footer: {
      tagline: "新一代跨平台 Minecraft 启动器",
      navigation: "页脚导航"
    },
    home: {
      pageTitle: "PCL N · 新一代 Minecraft 启动器",
      heroTitle: "新一代跨平台 Minecraft 启动器",
      screenshotAlt: "PCL N 启动器主界面实际截图",
      screenshotLabel: "实际启动器界面",
      badge: "PCL N EDITION",
      titleLead: "不只是启动游戏",
      titleAccent: "重新定义启动器",
      subtitle: "面向 Windows、macOS 与 Linux 的现代 Minecraft 启动器。管理实例、资源与账户，并通过受控的插件平台自由扩展。",
      download: "下载 PCL N",
      market: "浏览插件市场",
      previewTitle: "准备好开始冒险",
      previewText: "实例、Java 与游戏文件均已就绪",
      previewReady: "检查完成",
      previewLaunch: "启动游戏",
      previewPlugin: "插件已验证",
      previewVerified: "市场签名有效",
      previewUpdate: "保持最新",
      previewCurrent: "安全更新已启用",
      featuresTitle: "PCL N 核心能力",
      features: {
        native: { title: "原生跨平台", text: "NativeAOT 主程序覆盖 Windows、macOS 与 Linux，保持一致的使用体验。" },
        instances: { title: "完整实例管理", text: "集中管理游戏版本、加载器、模组、资源包、世界与 Java 环境。" },
        plugins: { title: "受控插件扩展", text: "权限清晰、签名可验证，让插件扩展能力而不牺牲可控性。" },
        updates: { title: "可靠更新", text: "稳定、测试与 CI 通道各自独立，支持校验、增量更新与安全回退。" }
      },
      ecosystemTitle: "从启动器，到完整生态",
      ecosystemText: "PCL N 将桌面体验、插件平台与开发文档连接起来，让玩家获得能力，让开发者拥有空间。",
      pluginTitle: "插件市场",
      pluginText: "发现经过审核与签名的扩展",
      docsTitle: "开发者文档",
      docsText: "从第一个插件到大型插件包",
      ctaTitle: "下一次启动，从这里开始",
      ctaText: "选择适合你设备的版本，PCL N 会引导你完成其余设置。",
      downloadNow: "立即下载"
    },
    download: {
      pageTitle: "下载 PCL N",
      title: "下载 PCL N",
      subtitle: "先选择平台，再在下载窗口中决定版本、运行时与安装方式。",
      platformLabel: "选择平台",
      choosePlatform: "你的平台",
      recommendationHint: "我们会优先推荐当前设备，并在下一步提供处理器架构与包型选项。",
      recommended: "适合此设备",
      chooseDownload: "选择下载",
      platforms: {
        windows: "适用于 Windows 10/11，提供 MSI、EXE 安装器与便携版。",
        macos: "适用于 Apple Silicon 与 Intel Mac，提供 DMG 安装包。",
        linux: "适用于主流 Linux 发行版，提供 DEB、RPM、AppImage 与 TAR.GZ。"
      },
      packagesLabel: "分发方式",
      packagesTitle: "每个平台各取所需",
      dialogTitle: "配置下载内容",
      close: "关闭下载窗口",
      version: "选择版本",
      versionHint: "新版本提供原生安装包，旧版本保留原始资产。",
      versionHistoryHint: "可下拉选择该通道的历史版本。",
      versionPlaceholder: "选择具体版本号",
      channel: "发布通道",
      channelEmpty: "暂无可用版本",
      catalogLoading: "正在同步拉取最新版本…",
      catalogLoadingShort: "同步中…",
      catalogLoadingHint: "版本列表加载完成后即可选择并下载",
      catalogReady: "已获取 {count} 个版本（GitHub）",
      catalogReadyApi: "已同步 {count} 个版本（API）",
      catalogReadyStatic: "已获取 {count} 个版本（站点缓存）",
      catalogFallback: "在线版本源暂不可用，已使用备用版本列表",
      stable: "正式版",
      beta: "测试版",
      ci: "CI",
      newPackages: "新分发格式",
      legacyPackages: "旧版兼容格式",
      architecture: "处理器架构",
      architectureHint: "不确定时保留系统推荐值。",
      includeRuntime: "是否包含运行时",
      includeRuntimeHint: "包含插件 Sidecar 所需的 .NET 运行时；主程序始终为 NativeAOT。CI 通道目前仅提供 SelfContained。",
      includePlugin: "是否包含插件",
      includePluginHint: "仅曾分别发布 WithPlugin/NoPlugin 的旧版本可选。",
      delivery: "安装包 / 便携版",
      deliveryHint: "安装包会写入标准应用目录；便携版可放在任意可写目录。",
      legacyDeliveryHint: "该旧版本只发布了兼容便携包。",
      packageKind: "安装包类型",
      packageKindHint: "Windows 3 种 · macOS 1 种 · Linux 4 种（与 GitHub Release 资源一一对应）。",
      legacyArchive: "兼容归档",
      installer: "安装包",
      portable: "便携版",
      portableTar: "便携 TAR.GZ",
      packageFormat: "安装包格式",
      packageFormatHint: "选择适合当前系统或包管理器的格式。",
      yes: "是",
      no: "否",
      legacyNotice: "所选版本发布于新打包流程之前，因此安装包选项不可用；下载仍使用当时发布并签名的原始便携包。",
      appImageHint:
        "GitHub 下载不会保留可执行权限。下载后请执行：chmod +x 文件名.AppImage && ./文件名.AppImage",
      signature: "GPG 签名",
      downloadNow: "下载",
      verifyTitle: "所有正式包均提供 GPG 签名",
      verifyText: "每个便携包和安装包都有独立 .asc 签名，可使用项目公钥核验。",
      publicKey: "查看项目公钥",
      thanks: {
        pageTitle: "开始下载 · PCL N",
        eyebrow: "DOWNLOAD",
        title: "已为你唤起下载",
        subtitle: "浏览器应已开始下载安装包。若没有反应，请使用下方按钮手动开始。",
        starting: "正在唤起下载…",
        started: "下载已唤起。若未开始，请点击下方链接。",
        appImageChmod:
          "AppImage 下载后默认没有可执行权限，请在终端运行：chmod +x {name} && ./{name}",
        blocked: "自动下载可能被拦截，请点击下方链接继续。",
        invalid: "下载链接无效，请返回重新选择版本。",
        manualLink: "若未开始下载，点此手动下载",
        hint: "下载文件来自 GitHub Releases，并附带独立 GPG 签名。",
        back: "← 返回下载页",
        allReleases: "查看全部发布"
      }
    }
  },
  menu: {
    publisher: {
      workspace: "发布者工作台",
      plugins: "插件",
      releases: "版本",
      submissions: "审核记录",
      organization: "组织与命名空间",
      finance: "收入与提现"
    },
    admin: {
      workspace: "平台管理",
      reviews: "审核队列",
      plugins: "插件目录",
      publishers: "发布者",
      users: "用户",
      withdrawals: "提现审核",
      members: "管理员",
      announcements: "启动器公告"
    },
    login: {
      auth: "登录",
      title: "PCL.N 插件中心",
      welcome: "欢迎登录",
      platform: "管理平台",
      description: "或许我们只是差点运气",
      account: "账号密码登录",
      in: "登录",
      loading: "登录中",
      beiAnHao: "网站备案号",
      picture: "看不清，换一张",
      form: {
        loginName: "请输入用户名",
        password: "请输入密码",
        securityCode: "请输入验证码"
      },
      rules: {
        loginName: {
          required: "用户名不能为空",
          validator: "账号只能包含数字和字母"
        },
        password: {
          required: "密码不能为空",
          validator1: "长度在 6 到 20 个字符",
          validator2: "密码必须包含数字和字母",
        },
        securityCode: {
          required: "验证码不能为空"
        }
      }
    },
    home: {
      auth: "主控台",
      work: {
        name: "工作台"
      },
      analysis: {
        name: "分析页"
      },
      console: {
        name: "控制台"
      }
    },
    system: {
      auth: "系统管理",
      user: {
        name: "用户管理",
        search: {
          label: {
            loginName: "登录账号",
            userName: "用户名称",
            phone: "手机号",
            deptId: "部门",
            loginTime: "登录时间",
          },
          placeholder: {
            loginName: "请输入登录账号",
            userName: "请输入用户名称",
            phone: "请输入手机号",
            deptId: "请选择部门",
          }
        },
        table: {
          loginName: "登录账号",
          deptName: "部门名称",
          avatar: "头像",
          userName: "用户名称",
          email: "邮箱",
          phone: "手机号",
          userType: "用户类型",
          sex: "用户性别",
          userStatus: "用户状态",
          loginTime: "登录时间"
        },
        form: {
          label: {
            loginName: "登录账号",
            password: "登录密码",
            userName: "用户名称",
            deptId: "部门名称",
            postId: "分配岗位",
            roleId: "分配角色",
            userType: "用户类型",
            userStatus: "用户状态",
            sex: "用户性别",
            avatar: "用户头像",
            phone: "手机号",
            email: "邮箱",
            remark: "用户备注"
          },
          placeholder: {
            loginName: "请输入登录账号",
            password: "请输入登录密码",
            userName: "请输入用户名称",
            deptId: "请选择部门",
            postId: "请选择岗位",
            roleId: "请选择角色",
            userType: "请选择用户类型",
            userStatus: "请选择用户状态",
            sex: "请选择用户性别",
            avatar: {
              description: "请上传头像",
              tip: "图片最大为 3M"
            },
            phone: "请输入手机号码",
            email: "请输入邮箱",
            remark: "请输入用户备注"
          }
        },
        rules: {
          loginName: { required: "请输入登录名称" },
          password: { required: "请输入用户密码", validator: "至少6位且包含字母和数字" },
          userName: { required: "请输入用户名字"},
          deptId: { required: "请选择用户部门" },
          userType: { required: "请输入用户类型" },
          sex: { required: "请选择用户性别" },
          userStatus: { required: "请选择用户状态" },
          phone: { required: "请输入手机号码" }
        },
        transfer: {
          role: "角色列表",
          post: "岗位列表"
        }
      },
      role: {
        name: "角色管理"
      },
      menu: {
        name: "菜单管理"
      },
      dictType: {
        name: "字典管理"
      },
      dictData: {
        name: "字典详情"
      },
      dept: {
        name: "部门管理"
      },
      post: {
        name: "岗位管理"
      },
      loginLogs: {
        name: "登录日志"
      },
      operateLogs: {
        name: "操作日志"
      },
      notice: {
        name: "通知公告"
      },
      personage: {
        name: "个人中心"
      }
    },
    monitor: {
      auth: "系统监控",
      scheduled: {
        name: "定时任务"
      },
      online: {
        name: "在线用户"
      },
      service: {
        name: "服务监控"
      },
      redis: {
        name: "Redis监控"
      },
      cache: {
        name: "数据缓存"
      },
      blocklist: {
        name: "阻止名单"
      }
    },
    tools: {
      auth: "系统工具",
      generate: {
        name: "代码生成"
      },
      config: {
        name: "代码配置"
      },
      file: {
        name: "文件管理"
      },
      picture: {
        name: "图库管理"
      },
      testDept: {
        name: "测试部门"
      },
      testParams: {
        name: "测试参数"
      }
    },
    link: {
      auth: "外部链接",
      back: {
        name: "前后端"
      },
      front: {
        name: "纯前端"
      },
      blog: {
        name: "博客版本"
      },
      element: {
        name: "ElementPlus"
      }
    },
    blog: {
      auth: "博客管理",
      category: {
        name: "文章类别"
      },
      tag: {
        name: "标签管理"
      },
      article: {
        name: "文章管理"
      },
      friend: {
        name: "友链管理"
      },
      circle: {
        name: "朋友圈"
      },
      danMu: {
        name: "弹幕管理"
      },
      notice: {
        name: "通知公告"
      },
      library: {
        name: "知识库管理"
      },
      libraryCatalog: {
        name: "知识库目录"
      },
      libraryPreview: {
        name: "知识库预览"
      },
      comment: {
        name: "评论管理"
      },
    },
    coding: {
      404: {
        name: "404 页面"
      },
      403: {
        name: "403 页面"
      },
      500: {
        name: "500 页面"
      }
    }
  },
  button: {
    search: "搜索",
    reset: "重置",
    add: "添加",
    update: "修改",
    delete: "删除",
    export: "导出",
    import: "导入",
    preview: "预览",
    password: "重置密码",
    expand: "展开/折叠",
    role: "分配角色",
    post: "分配岗位",
    menu: "分配菜单",
    dept: "分配部门",
    refreshCache: "刷新缓存",
    view: "查看",
    detail: "详情",
    save: "保存",
    force: "强退",
    logout: "注销",
    execute: "执行",
    executeOnce: "执行一次",
    file: "文件上传",
    image: "图片上传",
    upload: "上传",
    download: "下载",
    confirm: "确定",
    cancel: "取消",
    refresh: "刷新",
    hideSearch: "隐藏搜索",
    displaySearch: "显示搜索",
    close: "关闭",
    genCode: "生成代码",
    previewCode: "预览代码",
    sync: "同步",
    switch: "切换",
    publish: "发布",
    catalog: "目录",
    minimize: "收起窗口",
    restoreMinimized: "恢复表单窗口"
  },
  home: {
    welcome: "欢迎使用"
  },
  tabs: {
    refresh: "重新刷新",
    maximize: "全屏切换",
    exitMaximize: "退出全屏",
    closeCurrent: "关闭当前",
    closeLeft: "关闭左侧",
    closeRight: "关闭右侧",
    closeOther: "关闭其它",
    closeAll: "关闭所有",
    affix: "固定标签",
    unaffix: "取消固定"
  },
  header: {
    searchMenu: "搜索菜单",
    componentSize: "组件大小",
    refreshCache: "刷新缓存",
    lightMode: "明亮模式",
    darkMode: "暗黑模式",
    language: "语言翻译",
    fullScreen: "全屏",
    exitFullScreen: "退出全屏",
    collapseToolbar: "收起工具栏",
    expandToolbar: "展开工具栏",    
    settings: "设置",
    personalCenter: "个人中心",
    changePassword: "修改密码",
    logout: "退出登录",
    dimensionList: {
      default: "默认",
      large: "大型",
      small: "小型"
    },
    languageList: {
      chinese: "简体中文",
      english: "英文"
    },
    menuSearch: "菜单搜索：支持菜单名称、路径",
    searchMenuHint: "输入菜单名称或路径，快速定位页面",
    searchMenuSelect: "选择",
    searchMenuEnter: "确认",
    searchMenuEsc: "关闭"
  },
  msg: {
    success: "操作成功",
    fail: "操作失败，请刷新重试",
    selectData: "请选择数据",
    validFail: "验证失败，请检查表单内容",
    null: "暂无数据",
    closeTips: "您确认进行关闭么？",
    closed: "已关闭",
    cancelled: "已取消",
    remind: "温馨提示：",
    confirmWant: "您确认要",
    confirmDelete: "您确认要删除么？",
    confirmLogin: "账号身份已过期，请重新登录",
    selectDate: "请选择日期",
    selectDateTime: "请选择日期时间",
    selectNumber: "请输入数字",
    beginTime: "开始日期",
    endTime: "结束日期",
    to: "至",
    keyword: "关键字搜索",
    configFail: "配置失败",
    logIn: "请重新登录",
    yzmFail: "验证码获取失败"
  },
  table: {
    number: "序号",
    operate: "操作"
  },
  tree: {
    topLevel: "最顶级数据",
    selectParent: "请选择上级数据"
  },
  dict: {
    sys_switch_status: {
      open: "启用",
      stop: "停用",
    },
    sys_user_sex: {
      man: "男",
      woman: "女",
      unknown: "未知"
    },
    sys_yes_no: {
      yes: "是",
      no: "否"
    }
  }
};
