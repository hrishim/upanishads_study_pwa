import Cocoa
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        configureMainMenu()

        let config = WKWebViewConfiguration()
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        config.defaultWebpagePreferences = preferences

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1320, height: 860),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "Upanishads Study"
        window.center()
        window.contentView = webView
        window.makeKeyAndOrderFront(nil)

        if let resourceURL = Bundle.main.resourceURL {
            let webAppURL = resourceURL.appendingPathComponent("WebApp", isDirectory: true)
            let indexURL = webAppURL.appendingPathComponent("index.html")
            webView.loadFileURL(indexURL, allowingReadAccessTo: webAppURL)
        } else {
            let html = "<h2>Upanishads Study</h2><p>Could not locate bundled WebApp resources.</p>"
            webView.loadHTMLString(html, baseURL: nil)
        }
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        configureMainMenu()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    private func configureMainMenu() {
        let mainMenu = NSMenu()
        let appMenuItem = NSMenuItem(title: "Upanishads Study", action: nil, keyEquivalent: "")
        let appMenu = NSMenu(title: "Upanishads Study")
        appMenu.addItem(
            NSMenuItem(
                title: "Quit Upanishads Study",
                action: #selector(NSApplication.terminate(_:)),
                keyEquivalent: "q"
            )
        )
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)
        NSApplication.shared.mainMenu = mainMenu
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)
app.run()
