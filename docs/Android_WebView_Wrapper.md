# Android WebView Wrapper Guide (Restricted Access)

To create an app for your daughter that ONLY loads the portal and prevents any other browsing, use this minimal Kotlin code in Android Studio.

## 1. Create a New Project
- Open **Android Studio**.
- Choose "Empty Views Activity".
- Name: `IdAM Portal`
- Language: `Kotlin`.

## 2. Permissions (AndroidManifest.xml)
Add internet permission inside the `<manifest>` tag, before `<application>`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## 3. Layout (activity_main.xml)
Replace the content with a full-screen WebView:
```xml
<?xml version="1.0" encoding="utf-8"?>
<WebView xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/webView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

## 4. Code (MainActivity.kt)
This version restricts navigation context to your portal's URL:

```kotlin
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val portalUrl = "TU_URL_DE_VERCEL_AQUI" // Change this!
        val webView: WebView = findViewById(R.id.webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                // Restrict browsing to ONLY the portal domain
                if (url != null && url.contains(portalUrl)) {
                    return false // Load in webView
                }
                return true // Block external links
            }
        }
        
        webView.loadUrl(portalUrl)
    }
}
```

## 5. Alternatives
- **PWABuilder**: Visit [pwabuilder.com](https://www.pwabuilder.com/), enter your Vercel URL, and it will generate an Android APK for you automatically using the PWA manifest we just created.
