# Android ProGuard rules
-dontwarn androidx.**
-dontwarn okio.**
-dontwarn retrofit2.**
-dontwarn com.squareup.okhttp3.**

# Keep all Activities, Services, BroadcastReceivers
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver

# Keep all Parcelable classes
-keep public class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep R classes
-keep class **.R$* { *; }

# Keep all WebViewClient and WebChromeClient
-keep public class * extends android.webkit.WebViewClient
-keep public class * extends android.webkit.WebChromeClient

# Keep all View models
-keep class * extends androidx.lifecycle.ViewModel { *; }
