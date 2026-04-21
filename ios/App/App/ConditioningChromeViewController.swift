import UIKit
import Capacitor

/// Hosts `CAPBridgeViewController` as a child and lays out native header + tab bar around the WKWebView.
final class ConditioningChromeViewController: UIViewController, UITabBarDelegate {

    private let bridgeViewController = CAPBridgeViewController()

    private let headerContainer = UIView()
    private let subtitleLabel = UILabel()
    private let titleLabel = UILabel()
    private let userStack = UIStackView()
    private let userIdLabel = UILabel()
    private let activeLabel = UILabel()
    private let avatarLabel = UILabel()
    private let tabBarChrome = UITabBar()

    private var syncingChromeFromJs = false
    private let webViewLayoutGuide = UILayoutGuide()
    private var headerHeightConstraint: NSLayoutConstraint!
    private var tabBarHeightConstraint: NSLayoutConstraint!

    private static let tabSpec: [(id: String, title: String, symbol: String)] = [
        ("kokoro", "こころ", "water.waves"),
        ("undou", "運動", "figure.strengthtraining.traditional"),
        ("steps", "歩数", "figure.walk"),
        ("weight", "体重", "scalemass"),
        ("user", "ユーザー", "person.circle.fill"),
    ]

    private static let brandGreen = UIColor(red: 45 / 255, green: 90 / 255, blue: 39 / 255, alpha: 1)
    private static let bgColor = UIColor(red: 249 / 255, green: 248 / 255, blue: 244 / 255, alpha: 1)
    private static let mutedColor = UIColor(red: 155 / 255, green: 152 / 255, blue: 144 / 255, alpha: 1)
    private static let borderColor = UIColor(red: 228 / 255, green: 225 / 255, blue: 216 / 255, alpha: 1)
    private static let textColor = UIColor(red: 28 / 255, green: 28 / 255, blue: 26 / 255, alpha: 1)

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = Self.bgColor
        NativeChromeBridge.shell = self

        setupHeader()
        setupTabBarItems()
        setupChildBridge()
        setupLayoutConstraints()
        registerNativeChromePluginIfNeeded()
    }

    private func registerNativeChromePluginIfNeeded() {
        guard let bridge = bridgeViewController.bridge else { return }
        if bridge.plugin(withName: "NativeChrome") != nil { return }
        bridge.registerPluginInstance(NativeChromePlugin())
    }

    deinit {
        NativeChromeBridge.shell = nil
    }

    private func setupHeader() {
        headerContainer.backgroundColor = Self.bgColor
        headerContainer.layer.borderWidth = 1 / UIScreen.main.scale
        headerContainer.layer.borderColor = Self.borderColor.cgColor

        subtitleLabel.text = "PERSONAL HEALTH LOG"
        subtitleLabel.font = .systemFont(ofSize: 9, weight: .semibold)
        subtitleLabel.textColor = Self.mutedColor
        subtitleLabel.textAlignment = .center

        titleLabel.text = "Self Conditioning App"
        titleLabel.font = .systemFont(ofSize: 17, weight: .light)
        titleLabel.textColor = Self.brandGreen
        titleLabel.textAlignment = .center

        avatarLabel.text = "T"
        avatarLabel.font = .systemFont(ofSize: 12, weight: .bold)
        avatarLabel.textColor = Self.brandGreen
        avatarLabel.textAlignment = .center
        avatarLabel.layer.cornerRadius = 15
        avatarLabel.clipsToBounds = true
        avatarLabel.backgroundColor = UIColor(red: 234 / 255, green: 242 / 255, blue: 233 / 255, alpha: 1)
        avatarLabel.layer.borderWidth = 1.5
        avatarLabel.layer.borderColor = Self.brandGreen.cgColor
        avatarLabel.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            avatarLabel.widthAnchor.constraint(equalToConstant: 30),
            avatarLabel.heightAnchor.constraint(equalToConstant: 30),
        ])

        userIdLabel.font = .systemFont(ofSize: 11, weight: .semibold)
        userIdLabel.textColor = Self.textColor

        activeLabel.text = "ACTIVE"
        activeLabel.font = .systemFont(ofSize: 9, weight: .medium)
        activeLabel.textColor = Self.mutedColor

        let userTextColumn = UIStackView(arrangedSubviews: [userIdLabel, activeLabel])
        userTextColumn.axis = .vertical
        userTextColumn.alignment = .leading
        userTextColumn.spacing = 1

        userStack.axis = .horizontal
        userStack.alignment = .center
        userStack.spacing = 12
        userStack.addArrangedSubview(avatarLabel)
        userStack.addArrangedSubview(userTextColumn)

        let titleColumn = UIStackView(arrangedSubviews: [subtitleLabel, titleLabel])
        titleColumn.axis = .vertical
        titleColumn.alignment = .center
        titleColumn.spacing = 3

        let topRow = UIStackView(arrangedSubviews: [titleColumn, userStack])
        topRow.axis = .horizontal
        topRow.alignment = .center
        topRow.distribution = .fill
        topRow.spacing = 8
        topRow.translatesAutoresizingMaskIntoConstraints = false
        titleColumn.setContentHuggingPriority(.defaultLow, for: .horizontal)
        userStack.setContentHuggingPriority(.required, for: .horizontal)

        headerContainer.addSubview(topRow)
        NSLayoutConstraint.activate([
            topRow.leadingAnchor.constraint(equalTo: headerContainer.leadingAnchor, constant: 16),
            topRow.trailingAnchor.constraint(equalTo: headerContainer.trailingAnchor, constant: -16),
            topRow.topAnchor.constraint(equalTo: headerContainer.topAnchor, constant: 12),
            topRow.bottomAnchor.constraint(equalTo: headerContainer.bottomAnchor, constant: -12),
        ])
    }

    private func setupTabBarItems() {
        tabBarChrome.delegate = self
        tabBarChrome.isTranslucent = true
        tabBarChrome.barTintColor = Self.bgColor.withAlphaComponent(0.86)
        tabBarChrome.tintColor = Self.brandGreen
        tabBarChrome.unselectedItemTintColor = Self.mutedColor

        let items: [UITabBarItem] = Self.tabSpec.enumerated().map { index, spec in
            let img = UIImage(systemName: spec.symbol)?.withRenderingMode(.alwaysTemplate)
            let item = UITabBarItem(title: spec.title, image: img, tag: index)
            return item
        }
        tabBarChrome.items = items
        tabBarChrome.selectedItem = items.first
    }

    private func setupChildBridge() {
        addChild(bridgeViewController)
        view.addSubview(bridgeViewController.view)
        bridgeViewController.view.translatesAutoresizingMaskIntoConstraints = false
        bridgeViewController.didMove(toParent: self)
    }

    private func setupLayoutConstraints() {
        view.addLayoutGuide(webViewLayoutGuide)
        headerContainer.translatesAutoresizingMaskIntoConstraints = false
        tabBarChrome.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(headerContainer)
        view.addSubview(tabBarChrome)

        headerHeightConstraint = headerContainer.heightAnchor.constraint(equalToConstant: 0)
        tabBarHeightConstraint = tabBarChrome.heightAnchor.constraint(equalToConstant: 0)

        NSLayoutConstraint.activate([
            headerContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            headerContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            headerHeightConstraint,

            tabBarChrome.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tabBarChrome.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tabBarChrome.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),

            webViewLayoutGuide.topAnchor.constraint(equalTo: headerContainer.bottomAnchor),
            webViewLayoutGuide.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webViewLayoutGuide.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webViewLayoutGuide.bottomAnchor.constraint(equalTo: tabBarChrome.topAnchor),

            bridgeViewController.view.topAnchor.constraint(equalTo: webViewLayoutGuide.topAnchor),
            bridgeViewController.view.leadingAnchor.constraint(equalTo: webViewLayoutGuide.leadingAnchor),
            bridgeViewController.view.trailingAnchor.constraint(equalTo: webViewLayoutGuide.trailingAnchor),
            bridgeViewController.view.bottomAnchor.constraint(equalTo: webViewLayoutGuide.bottomAnchor),
        ])
        tabBarHeightConstraint.isActive = true
    }

    override var childForStatusBarStyle: UIViewController? {
        bridgeViewController
    }

    override var prefersStatusBarHidden: Bool {
        bridgeViewController.prefersStatusBarHidden
    }

    // MARK: - UITabBarDelegate

    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard !syncingChromeFromJs else { return }
        let idx = item.tag
        guard idx >= 0, idx < Self.tabSpec.count else { return }
        let tabId = Self.tabSpec[idx].id
        notifyTabSelected(tabId)
    }

    private func notifyTabSelected(_ tabId: String) {
        guard let bridge = bridgeViewController.bridge,
              let plugin = bridge.plugin(withName: "NativeChrome") else { return }
        plugin.notifyListeners("nativeTabSelected", data: ["tab": tabId])
    }

    // MARK: - Called from NativeChromePlugin

    func applyChrome(tab: String?, userId: String?, visible: Bool) {
        headerHeightConstraint.constant = visible ? 76 : 0
        if visible {
            tabBarHeightConstraint.isActive = false
        } else {
            tabBarHeightConstraint.constant = 0
            tabBarHeightConstraint.isActive = true
        }
        headerContainer.isHidden = !visible
        tabBarChrome.isHidden = !visible
        headerContainer.alpha = visible ? 1 : 0
        tabBarChrome.alpha = visible ? 1 : 0

        if let uid = userId, !uid.isEmpty {
            userIdLabel.text = "@\(uid)"
        } else {
            userIdLabel.text = "@—"
        }

        if let tab = tab, let idx = Self.tabSpec.firstIndex(where: { $0.id == tab }) {
            syncingChromeFromJs = true
            tabBarChrome.selectedItem = tabBarChrome.items?[idx]
            syncingChromeFromJs = false
        }
    }
}

/// Weak link from `NativeChromePlugin` to the shell view controller.
enum NativeChromeBridge {
    static weak var shell: ConditioningChromeViewController?
}
