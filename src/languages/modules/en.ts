export default {
  project: {
    title: "PCL.N Plugin Center"
  },
  admin: {
    workspace: "Admin workspace",
    refresh: "Refresh",
    cancel: "Cancel",
    confirm: "Confirm",
    actions: "Actions",
    empty: "No data",
    reviews: {
      title: "Review queue",
      description:
        "Claim a submission, verify package hash, manifest and release notes, then record a clear decision.",
      pluginId: "Plugin ID",
      version: "Version",
      status: "Status",
      packageHash: "Package hash",
      publisherNotes: "Publisher notes",
      submittedAt: "Submitted",
      claim: "Claim",
      approve: "Approve",
      requestChanges: "Request changes",
      reject: "Reject",
      closed: "Closed",
      empty: "No submissions in the queue",
      decisionReason: "Review notes",
      decisionReasonHint: "At least 3 characters when rejecting or requesting changes",
      confirmPrefix: "Confirm ",
      plugin: "Plugin",
      approveTitle: "Approve release",
      rejectTitle: "Reject release",
      changesTitle: "Request changes",
      decideTitle: "Review",
      claimSuccess: "Review claimed",
      claimFailed: "Failed to claim review",
      reasonRequired: "Enter at least 3 characters of review notes",
      decideSuccess: "Decision saved",
      decideFailed: "Failed to save decision"
    },
    publishers: {
      title: "Publisher governance",
      description:
        "Verify namespaces and suspend or restore publisher organizations when needed. All changes are audited.",
      organizations: "Publisher organizations",
      organization: "Organization",
      slug: "Slug",
      status: "Status",
      active: "Active",
      suspended: "Suspended",
      createdAt: "Created",
      suspend: "Suspend",
      restore: "Restore",
      emptyOrgs: "No publisher organizations",
      namespaces: "Namespace requests",
      namespace: "Namespace",
      verified: "Verified",
      pending: "Pending",
      appliedAt: "Requested",
      revokeVerification: "Revoke",
      verify: "Verify",
      emptyNamespaces: "No namespace requests",
      suspendConfirm: "Suspending blocks further publish writes for this organization. Continue?",
      restoreConfirm: "Restore this publisher organization?",
      statusConfirmTitle: "Confirm publisher status",
      orgRestored: "Organization restored",
      orgSuspended: "Organization suspended",
      orgUpdateFailed: "Failed to update organization status",
      verifyConfirm: "Confirm that {org} owns namespace {ns}?",
      revokeConfirm: "Revoking will block new version uploads. Continue?",
      namespaceConfirmTitle: "Namespace verification",
      namespaceVerified: "Namespace verified",
      namespaceRevoked: "Namespace verification revoked",
      namespaceUpdateFailed: "Failed to update verification"
    },
    users: {
      title: "Users",
      description:
        "Identities come from Supabase Auth. Copy a UUID and appoint admin / reviewer / auditor on the Administrators page.",
      displayName: "Display name",
      github: "GitHub",
      userId: "User UUID",
      firstLogin: "First sign-in",
      appointHint:
        "To appoint an admin: open Platform admin → Administrators, paste the user UUID and choose a role."
    },
    members: {
      title: "Administrators",
      description:
        "Only the super admin can appoint or revoke administrators. Super-admin rights cannot be revoked, demoted or reassigned. Other admins can view the list only.",
      appoint: "Appoint admin",
      viewOnlyHint:
        "You are not the super admin. You can view the administrator list but cannot appoint or revoke.",
      displayName: "Display name",
      superAdmin: "Super admin",
      github: "GitHub",
      email: "Email",
      role: "Role",
      userId: "User UUID",
      appointedAt: "Appointed",
      revoke: "Revoke",
      irrevocable: "Irrevocable",
      empty: "No administrators",
      userIdPlaceholder: "Copy user_id from the Users page",
      roleAdmin: "Admin (admin)",
      roleReviewer: "Reviewer (reviewer)",
      roleAuditor: "Auditor (auditor)",
      roleAdminShort: "Admin",
      roleReviewerShort: "Reviewer",
      roleAuditorShort: "Auditor",
      appointHint:
        "Ask them to sign in with GitHub once, then copy their UUID from Users. Super-admin identity cannot be transferred via appointment.",
      confirmAppoint: "Confirm appointment",
      onlySuperCanAppoint: "Only the super admin can appoint administrators",
      invalidUuid: "Enter a valid user UUID",
      appointed: "Appointed",
      appointFailed: "Appointment failed",
      superIrrevocable: "Super admin cannot be revoked",
      revokeConfirm: "Revoke admin rights for {name} ({role})?",
      revokeTitle: "Revoke administrator",
      revoked: "Revoked",
      revokeFailed: "Revoke failed",
      loadFailed: "Failed to load"
    },
    announcements: {
      title: "Launcher announcements",
      description:
        "Fetched by the desktop client on launch. Supports multilingual Markdown, channel/platform filters and version ranges.",
      publish: "Publish",
      id: "ID",
      headline: "Title",
      severity: "Severity",
      status: "Status",
      enabled: "Enabled",
      disabled: "Disabled",
      enable: "Enable",
      disable: "Disable",
      priority: "Priority",
      starts: "Starts",
      ends: "Ends",
      indefinite: "No end",
      edit: "Edit",
      remove: "Delete",
      empty: "No announcements",
      editTitle: "Edit announcement",
      createTitle: "Publish announcement",
      save: "Save",
      announcementId: "Announcement ID",
      severityInfo: "Info",
      severityImportant: "Important",
      severitySecurity: "Security",
      severityInfoShort: "Info",
      severityImportantShort: "Important",
      severitySecurityShort: "Security",
      dismissible: "Dismissible",
      startsAt: "Starts at",
      endsAt: "Ends at (optional)",
      minVersion: "Minimum version (optional)",
      maxVersion: "Maximum version exclusive (optional)",
      channels: "Channels (comma-separated, empty = all)",
      platforms: "Platforms (comma-separated, empty = all)",
      zhContent: "Chinese content (zh-CN)",
      enContent: "English content (en-US, optional)",
      bodyMd: "Body Markdown",
      primaryLabel: "Primary button label",
      actionLabel: "Action button label",
      actionUrl: "Action URL",
      loadFailed: "Failed to load",
      saved: "Saved",
      saveFailed: "Save failed",
      deleteConfirm: "Delete announcement {id}?",
      deleted: "Deleted",
      deleteFailed: "Delete failed",
      enabledOk: "Enabled",
      disabledOk: "Disabled",
      toggleFailed: "Failed to update status"
    },
    withdrawals: {
      title: "Withdrawal review",
      description: "Verify Alipay mask and amount, transfer funds, then mark as paid.",
      organization: "Organization",
      amount: "Amount",
      payoutAccount: "Payout account",
      status: "Status",
      approve: "Approve",
      reject: "Reject",
      markPaid: "Mark paid",
      rejectReason: "Enter rejection reason",
      dialogTitle: "Withdrawal review",
      updated: "Status updated"
    },
    status: {
      pending: "Pending",
      in_review: "In review",
      approved: "Approved",
      rejected: "Rejected",
      changes_requested: "Changes requested",
      paid: "Paid",
      cancelled: "Cancelled"
    },
    tableEmpty: "No data in your permission scope"
  },
  login: {
    badge: "PCL.N Plugin Platform",
    heroTitle: "Publish, review and distribute plugins<br />on one trusted path",
    heroSubtitle:
      "Publisher workspaces and platform admin share identity, audit logs and security scan results.",
    featureAuth: "GitHub OAuth single sign-on",
    featureRls: "Publisher and admin data isolation",
    featureScanner: "Out-of-process package security scanning",
    title: "PCL.N Plugin Center",
    copy: "Sign in with GitHub to open the publisher workspace. Admin rights are granted separately via membership.",
    legalPrefix: "I have read and agree to the",
    terms: "Terms of Service",
    and: "and",
    privacy: "Privacy Policy",
    legalHint: "Required before first N Cloud registration / sign-in. Document version {version}.",
    github: "Continue with GitHub",
    microsoft: "Continue with Microsoft",
    securityNote:
      "The browser only uses the Supabase publishable key; privileged writes go through protected APIs.",
    market: "Browse plugin market",
    docs: "Plugin developer docs",
    opensource: "Open-source admin UI",
    cancel: "Cancel",
    accountExistsTitle: "Account already exists",
    accountExistsBody:
      "This email already belongs to another PCL N online account. Sign in with the original account and link the provider you just chose?",
    accountExistsConfirm: "Sign in and link",
    useOriginalAccount: "Please sign in with the original account. You can confirm linking on the account page.",
    noDuplicateAccount: "No duplicate account was created. Sign in with the original account, then link this provider.",
    acceptLegalFirst: "Please accept the Terms of Service and Privacy Policy before continuing.",
    acceptLegalWarn: "Please read and accept the Terms of Service and Privacy Policy",
    restoreFailed: "Could not restore the sign-in session"
  },
  authCallback: {
    completing: "Finishing sign-in…",
    success: "Signed in. Redirecting…",
    invalid: "Invalid sign-in handoff. Please sign in again.",
    failed: "Sign-in handoff failed"
  },
  market: {
    header: {
      brand: "PCL N",
      navigation: "Site navigation",
      home: "Home",
      plugins: "Plugins",
      download: "Download",
      docs: "Documentation",
      dashboard: "Developer Console",
      signIn: "Sign in",
      switchLanguage: "Switch to Chinese",
      switchTheme: "Switch light, dark, or system theme"
    },
    home: {
      badge: "Verified natively by the PCL N launcher",
      title: "More possibilities for your launcher",
      subtitle: "Discover reviewed and signed PCL N plugins. Browse and license them here; the launcher handles installation, updates, and signature verification.",
      signatureTitle: "Market signed",
      signatureText: "Distributed builds are signed by the Plugin Center",
      nativeTitle: "Native experience",
      nativeText: "Interfaces match the launcher's visual language",
      updateTitle: "Safe updates",
      updateText: "Monotonic versions with rollback and revocation",
      discover: "Explore plugins",
      searchPlaceholder: "Search by name, plugin ID, or tag",
      allCategories: "All categories",
      search: "Search",
      categories: "Categories",
      all: "All plugins",
      resultCount: "{count} plugins found",
      free: "Free",
      noSummary: "The developer has not provided a summary yet.",
      version: "Version {version}",
      details: "View details",
      emptyTitle: "No plugins found",
      emptyDescription: "Try another keyword or category.",
      loadFailed: "Unable to load the plugin market"
    },
    detail: {
      back: "Back to Plugin Market",
      loading: "Loading plugin information",
      errorTitle: "Unable to load plugin",
      overview: "About this plugin",
      tags: "Tags",
      pluginId: "Plugin ID",
      latestVersion: "Latest version",
      publisher: "Publisher",
      permissions: "Permissions",
      noPermissions: "No additional permissions",
      noDescription: "The developer has not provided a detailed description yet.",
      free: "Free",
      actionLoading: "Loading",
      getInLauncher: "Get in PCL N",
      owned: "Owned · Get in PCL N",
      purchase: "Purchase / Verify order",
      freeHint: "No purchase record is required. Get this plugin directly in the PCL N launcher.",
      ownedHint: "You own a permanent license. Finish installation and verification in the launcher.",
      purchaseHint: "One purchase, permanent license. Return to the launcher after authorization.",
      launcherHint: "Open PCL N → Plugins → Market → search “{name}” → Get. Packages are downloaded and verified only inside the launcher.",
      copied: "Plugin ID copied: {id}",
      openHint: "Search for this plugin in the PCL N market. The browser will also try to open the installed launcher.",
      policyTitle: "Digital content and installation",
      policy: "Redeeming an order delivers a permanent digital-content license. Refunds are unavailable except for fraud, duplicate charges, or mandatory legal requirements. This website provides browsing and licensing; installation and market verification happen in PCL N.",
      redeemTitle: "Verify Afdian order",
      redeemNotice: "Sponsor any amount on the platform's Afdian page, no less than the plugin price. Each order can be redeemed once.",
      orderNumber: "Afdian order number",
      orderPlaceholder: "Enter the order number",
      extraAmount: "Use the extra amount to",
      publisherSupport: "Support the publisher (10% / 90% split remains)",
      platformSupport: "Support the platform",
      cancel: "Cancel",
      verify: "Verify and authorize",
      orderRequired: "Enter an order number",
      redeemSuccess: "Order verified. Your permanent license is ready; open PCL N to get the plugin.",
      redeemFailed: "Order verification failed",
      loadFailed: "Unable to load plugin information"
    },
    categories: {
      compatibility: "Compatibility",
      management: "Management",
      ui: "UI extensions",
      tools: "Utilities",
      utility: "Utilities",
      integration: "Integrations",
      theme: "Themes",
      developer: "Developer tools",
      gameplay: "Gameplay"
    }
  },
  site: {
    footer: {
      tagline: "A new-generation cross-platform Minecraft launcher",
      navigation: "Footer navigation"
    },
    home: {
      pageTitle: "PCL N · A new-generation Minecraft launcher",
      heroTitle: "A next-generation cross-platform Minecraft launcher",
      screenshotAlt: "Actual screenshot of the PCL N launcher home screen",
      screenshotLabel: "Actual launcher interface",
      badge: "PCL N EDITION",
      titleLead: "More than launching",
      titleAccent: "Minecraft",
      subtitle: "A modern Minecraft launcher for Windows, macOS, and Linux. Manage instances, content, and accounts, then extend it through a controlled plugin platform.",
      download: "Download PCL N",
      market: "Explore plugins",
      previewTitle: "Ready for your next adventure",
      previewText: "Instance, Java, and game files are ready",
      previewReady: "Checks complete",
      previewLaunch: "Play",
      previewPlugin: "Plugin verified",
      previewVerified: "Market signature is valid",
      previewUpdate: "Up to date",
      previewCurrent: "Safe updates enabled",
      featuresTitle: "Core PCL N capabilities",
      features: {
        native: { title: "Native cross-platform", text: "A NativeAOT desktop host delivers a consistent experience across Windows, macOS, and Linux." },
        instances: { title: "Complete instance control", text: "Manage game versions, loaders, mods, resource packs, worlds, and Java environments together." },
        plugins: { title: "Controlled extensibility", text: "Clear permissions and verifiable signatures let plugins add power without giving up control." },
        updates: { title: "Reliable updates", text: "Stable, beta, and CI channels stay separate, with verification, patches, and safe rollback." }
      },
      ecosystemTitle: "From launcher to ecosystem",
      ecosystemText: "PCL N connects the desktop experience, plugin platform, and developer documentation—giving players capability and developers room to build.",
      pluginTitle: "Plugin Market",
      pluginText: "Discover reviewed and signed extensions",
      docsTitle: "Developer documentation",
      docsText: "From your first plugin to large plugin suites",
      ctaTitle: "Your next launch starts here",
      ctaText: "Choose the build for your device and PCL N will guide you through the rest.",
      downloadNow: "Download now"
    },
    download: {
      pageTitle: "Download PCL N",
      title: "Download PCL N",
      subtitle: "Choose a platform first, then select a version, runtime, and delivery format in the download dialog.",
      platformLabel: "Choose a platform",
      choosePlatform: "Your platform",
      recommendationHint: "We recommend the current device and offer architecture and package options in the next step.",
      recommended: "Best for this device",
      chooseDownload: "Choose download",
      platforms: {
        windows: "For Windows 10/11, with MSI, EXE installer, and portable builds.",
        macos: "For Apple Silicon and Intel Macs, distributed as a DMG installer.",
        linux: "For major Linux distributions, with DEB, RPM, AppImage, and TAR.GZ builds."
      },
      packagesLabel: "Delivery",
      packagesTitle: "The right package for every platform",
      dialogTitle: "Configure your download",
      close: "Close download dialog",
      version: "Choose a version",
      versionHint: "New releases include native installers; previous releases keep their original assets.",
      versionHistoryHint: "Open the list to pick a historical build in this channel.",
      versionPlaceholder: "Select a version",
      channel: "Channel",
      channelEmpty: "No builds available",
      catalogLoading: "Syncing latest versions…",
      catalogLoadingShort: "Syncing…",
      catalogLoadingHint: "You can pick options after the version list finishes loading",
      catalogReady: "Loaded {count} versions (GitHub)",
      catalogReadyApi: "Synced {count} versions (Cloudflare)",
      catalogReadyStatic: "Loaded {count} versions (site snapshot)",
      catalogFallback: "Online catalog unavailable; using fallback version list",
      stable: "Release",
      beta: "Beta",
      ci: "CI",
      newPackages: "New package set",
      legacyPackages: "Legacy-compatible set",
      architecture: "Processor architecture",
      architectureHint: "Keep the recommended value if you are unsure.",
      includeRuntime: "Include runtime",
      includeRuntimeHint: "Includes .NET for the plugin sidecar; the desktop host always remains NativeAOT. CI currently ships SelfContained only.",
      includePlugin: "Include plugin",
      includePluginHint: "Only shown for older releases that shipped separate WithPlugin and NoPlugin assets.",
      delivery: "Installer / portable",
      deliveryHint: "Installers use the standard app location; portable builds can live in any writable folder.",
      legacyDeliveryHint: "This previous release only provides its compatible portable package.",
      packageKind: "Package type",
      packageKindHint: "Windows ×3 · macOS ×1 · Linux ×4 — names match GitHub Release assets.",
      legacyArchive: "Legacy archive",
      installer: "Installer",
      portable: "Portable",
      portableTar: "Portable TAR.GZ",
      packageFormat: "Package format",
      packageFormatHint: "Choose the format for your system or package manager.",
      yes: "Yes",
      no: "No",
      legacyNotice: "This version predates the new packaging pipeline, so installer choices are unavailable. The download remains its original signed portable asset.",
      appImageHint:
        "Browsers and GitHub downloads strip the executable bit. After download run: chmod +x Your.AppImage && ./Your.AppImage",
      signature: "GPG signature",
      downloadNow: "Download",
      verifyTitle: "Every stable package includes a GPG signature",
      verifyText: "Every portable build and installer has its own .asc signature for verification with the project public key.",
      publicKey: "View project public key",
      thanks: {
        pageTitle: "Download started · PCL N",
        eyebrow: "DOWNLOAD",
        title: "Your download should start",
        subtitle: "We asked the browser to start the download. If nothing happens, use the button below.",
        starting: "Starting download…",
        started: "Download triggered. If it did not start, use the link below.",
        appImageChmod:
          "AppImage files lose the executable bit after download. Run: chmod +x {name} && ./{name}",
        blocked: "Automatic download may be blocked. Use the link below to continue.",
        invalid: "Invalid download link. Go back and pick a version again.",
        manualLink: "If the download did not start, click here",
        hint: "Files come from GitHub Releases and include a separate GPG signature.",
        back: "← Back to download",
        allReleases: "All releases"
      }
    }
  },
  menu: {
    publisher: {
      workspace: "Publisher workspace",
      plugins: "Plugins",
      releases: "Releases",
      submissions: "Submissions",
      organization: "Organization & namespaces",
      finance: "Revenue & withdrawals"
    },
    admin: {
      workspace: "Platform admin",
      reviews: "Review queue",
      plugins: "Plugin catalog",
      publishers: "Publishers",
      users: "Users",
      withdrawals: "Withdrawals",
      members: "Administrators",
      announcements: "Launcher announcements"
    },
    login: {
      auth: "Login",
      title: "PCL.N Plugin Center",
      welcome: "Welcome to login",
      platform: "Management platform",
      description: "Maybe we just got lucky",
      account: "Account password login",
      in: "Log in",
      loading: "Be logging in",
      beiAnHao: "Website record number",
      picture: "I can't see it. Change it",
      form: {
        loginName: "Please enter your username",
        password: "Please enter password",
        securityCode: "Please enter the verification code",
      },
      rules: {
        loginName: {
          required: "The user name cannot be empty",
          validator: "The account can only contain numbers and letters"
        },
        password: {
          required: "The password cannot be empty",
          validator1: "6 to 20 characters in length",
          validator2: "The password must contain both numbers and letters",
        },
        securityCode: {
          required: "The verification code cannot be empty"
        }
      }
    },
    home: {
      auth: "Master Station",
      work: {
        name: "Workbench page"
      },
      analysis: {
        name: "Analysis page"
      },
      console: {
        name: "Console Page"
      }
    },
    system: {
      auth: "System Manage",
      user: {
        name: "User Manage",
        search: {
          label: {
            loginName: "Login name",
            userName: "User name",
            phone: "Phone number",
            deptId: "Department",
            loginTime: "Login time",  
          },
          placeholder: {
            loginName: "Please enter your login account",
            userName: "Please enter the user name",
            phone: "Please enter your phone number",
            deptId: "Please select a department",
          }
        },
        table: {
          loginName: "Login name",
          deptName: "Department",
          avatar: "Avatar",
          userName: "User name",
          email: "Email",
          phone: "Phone number",
          userType: "User type",
          sex: "Gender",
          userStatus: "User status",
          loginTime: "Login time"
        },
        form: {
          label: {
            loginName: "Login name",
            password: "Password",
            userName: "User name",
            deptId: "Department",
            postId: "Job allocation",
            roleId: "Assign roles",
            userType: "User type",
            userStatus: "User status",
            sex: "Gender",
            avatar: "Avatar",
            phone: "Phone number",
            email: "Email",
            remark: "Remark"
          },
          placeholder: {
            loginName: "Please enter your login account",
            password: "Please enter your password",
            userName: "Please enter the user name",
            deptId: "Please select a department",
            postId: "Please select the position",
            roleId: "Please select a role",
            userType: "Please select the user type",
            userStatus: "Please select the user status",
            sex: "Please select the user's gender",
            avatar: {
              description: "Upload an avatar",
              tip: "The maximum size of the picture is 3M"
            },
            phone: "Please enter your phone number",
            email: "Please enter your email address",
            remark: "Please enter the user's remarks"
          }
        },
        rules: {
          loginName: { required: "Please enter your login account" },
          password: { required: "Please enter your user password", validator: "At least 6 digits and containing letters and numbers" },
          userName: { required: "Please enter the user name"},
          deptId: { required: "Please select the department" },
          userType: { required: "Please enter the user type" },
          sex: { required: "Please select the user's gender" },
          userStatus: { required: "Please select the user status" },
          phone: { required: "Please enter your phone number" }
        },
        transfer: {
          role: "List of roles",
          post: "Job list"
        }
      },
      role: {
        name: "Role Manage"
      },
      menu: {
        name: "Menu Manage"
      },
      dictType: {
        name: "DictType Manage"
      },
      dictData: {
        name: "DictData Manage"
      },
      dept: {
        name: "Dept Manage"
      },
      post: {
        name: "Post Manage"
      },
      loginLogs: {
        name: "Login Logs"
      },
      operateLogs: {
        name: "Operate Logs"
      },
      notice: {
        name: "Notice Manage"
      },
      personage: {
        name: "Personage Center"
      }
    },
    monitor: {
      auth: "System Monitor",
      scheduled: {
        name: "Scheduled Task"
      },
      online: {
        name: "Online User"
      },
      service: {
        name: "Service Monitor"
      },
      redis: {
        name: "Redis Monitor"
      },
      cache: {
        name: "Data Cache"
      },
      blocklist: {
        name: "Blocklist Manage"
      }
    },
    tools: {
      auth: "System Tool",
      generate: {
        name: "Code Generate"
      },
      config: {
        name: "Code Config"
      },
      file: {
        name: "Files Manage"
      },
      picture: {
        name: "Pictures Manage"
      },
      testDept: {
        name: "TestDept Manage"
      },
      testParams: {
        name: "TestDept Params"
      }
    },
    link: {
      auth: "External Link",
      back: {
        name: "Back Version"
      },
      front: {
        name: "Front Version"
      },
      blog: {
        name: "Blog Version"
      },
      element: {
        name: "ElementPlus"
      }
    },
    blog: {
      auth: "Blog Manage",
      category: {
        name: "Article Category"
      },
      tag: {
        name: "Tags Manage"
      },
      article: {
        name: "Article Manage"
      },
      friend: {
        name: "Friend Link"
      },
      circle: {
        name: "Circle Manage"
      },
      danMu: {
        name: "DanMu Manage"
      },
      notice: {
        name: "Notice Manage"
      },
      library: {
        name: "Knowledge Base"
      },
      libraryCatalog: {
        name: "Knowledge Catalog"
      },
      libraryPreview: {
        name: "Knowledge Preview"
      },
      comment: {
        name: "Comment Manage"
      },
    },
    coding: {
      404: {
        name: "404 Page"
      },
      403: {
        name: "403 Page"
      },
      500: {
        name: "500 Page"
      }
    }
  },
  button: {
    search: "Search",
    reset: "Reset",
    add: "Add",
    update: "Update",
    delete: "Delete",
    export: "Export",
    import: "Import",
    preview: "Preview",
    password: "Reset Password",
    expand: "Expand/Fold",
    role: "Assign Roles",
    post: "Assign Jobs",
    menu: "Assign Menu",
    dept: "Assign Dept",
    refreshCache: "Refresh Cache",
    view: "View",
    detail: "Detail",
    save: "Save",
    force: "Force Offline",
    logout: "Logout",
    execute: "Execute",
    executeOnce: "Execute Once",
    file: "File Upload",
    image: "Image Upload",
    upload: "Upload",
    download: "Download",
    confirm: "Confirm",
    cancel: "Cancel",
    refresh: "Refresh",
    hideSearch: "Hide Search",
    displaySearch: "Display Search",
    close: "Close",
    genCode: "Generate Code",
    previewCode: "Preview Code",
    sync: "Sync",
    switch: "Switch",
    publish: "Publish",
    catalog: "Catalog",
    minimize: "Minimize",
    restoreMinimized: "Restore form window"
  },
  home: {
    welcome: "Welcome"
  },
  tabs: {
    refresh: "Refresh",
    maximize: "Maximize",
    exitMaximize: "Exit Maximize",
    closeCurrent: "Close Current",
    closeLeft: "Close Left",
    closeRight: "Close Right",
    closeOther: "Close Other",
    closeAll: "Close All",
    affix: "Affix Tab",
    unaffix: "Unfix Tab"
  },
  header: {
    searchMenu: "Search menu",
    componentSize: "Component size",
    refreshCache: "Refresh cache",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    language: "Language translation",
    fullScreen: "Full Screen",
    exitFullScreen: "Exit Full Screen",
    collapseToolbar: "Collapse toolbar",
    expandToolbar: "Expand toolbar",    
    personalCenter: "Personal Center",
    settings: "Settings",
    changePassword: "Change password",
    logout: "Log out",
    dimensionList: {
      default: "default",
      large: "large",
      small: "small"
    },
    languageList: {
      chinese: "Chinese",
      english: "English"
    },
    menuSearch: "Menu search: Support menu name, path",
    searchMenuHint: "Type a menu name or path to navigate quickly",
    searchMenuSelect: "Navigate",
    searchMenuEnter: "Open",
    searchMenuEsc: "Close"
  },
  msg: {
    success: "Operation successful",
    fail: "Operation failed. Please refresh and try again",
    selectData: "Please select the data",
    validFail: "Validation failed. Please check the form contents",
    null: "No data for now",
    closeTips: "Are you sure you want to close it?",
    closed: "Closed",
    cancelled: "Cancelled",
    remind: "Friendly reminder:",
    confirmWant: "Do you confirm that you want",
    confirmDelete: "Are you sure you want to delete it?",
    confirmLogin: "The account identity has expired, please log in again",
    selectDate: "Please select a date",
    selectDateTime: "Please select a date and time",
    selectNumber: "Please enter the number",
    beginTime: "Begin Time",
    endTime: "End Time",
    to: "to",
    keyword: "Keyword search",
    configFail: "Configuration failed",
    logIn: "Please log in again",
    yzmFail: "Captcha acquisition failed"
  },
  table: {
    number: "#",
    operate: "Operation"
  },
  tree: {
    topLevel: "Top level data",
    selectParent: "Please select parent data"
  },
  dict: {
    sys_switch_status: {
      open: "open",
      stop: "stop",
    },
    sys_user_sex: {
      man: "man",
      woman: "woman",
      unknown: "unknown"
    },
    sys_yes_no: {
      yes: "yes",
      no: "no"
    }
  }
};
