package md.vadikonline1.gustbebe

import android.app.Application
import coil3.ImageLoader
import coil3.PlatformContext
import coil3.SingletonImageLoader
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import coil3.request.crossfade
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.tasks.Tasks
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import md.vadikonline1.gustbebe.data.RecipeRepository
import md.vadikonline1.gustbebe.data.SessionStore
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.UiTheme
import md.vadikonline1.gustbebe.push.PushService

class GustBebeApp : Application(), SingletonImageLoader.Factory {
    lateinit var repo: RecipeRepository
        private set

    override fun onCreate() {
        super.onCreate()
        repo = RecipeRepository(this)
        try {
            MobileAds.initialize(this) {}
        } catch (_: Exception) {
        }
        CoroutineScope(Dispatchers.IO).launch {
            try {
                UiLang.current = SessionStore(this@GustBebeApp).lang()
            } catch (_: Exception) {
            }
            try {
                UiTheme.current = SessionStore(this@GustBebeApp).theme()
            } catch (_: Exception) {
            }
            bootstrapPush()
        }
    }

    // Firebase fara google-services.json: config din remote-config (chei publice),
    // tokenul FCM se inregistreaza la backend pentru push la retete noi.
    private suspend fun bootstrapPush() {
        try {
            val cfg = try { repo.config()?.firebase } catch (_: Exception) { null } ?: return
            if (cfg.projectId.isBlank() || cfg.apiKey.isBlank() || cfg.appId.isBlank()) return
            withContext(Dispatchers.Main) {
                try {
                    if (FirebaseApp.getApps(this@GustBebeApp).isEmpty()) {
                        FirebaseApp.initializeApp(
                            this@GustBebeApp,
                            FirebaseOptions.Builder()
                                .setProjectId(cfg.projectId)
                                .setApplicationId(cfg.appId)
                                .setApiKey(cfg.apiKey)
                                .setGcmSenderId(cfg.senderId)
                                .build()
                        )
                    }
                } catch (_: Exception) {
                }
            }
            if (FirebaseApp.getApps(this@GustBebeApp).isEmpty()) return
            val token = try {
                Tasks.await(FirebaseMessaging.getInstance().token)
            } catch (_: Exception) {
                null
            }
            if (!token.isNullOrBlank()) PushService.uploadToken(this@GustBebeApp, token)
        } catch (_: Exception) {
        }
    }

    // Fara fetcher de retea, Coil3 nu incarca URL-uri http(s) — de aici imaginile goale.
    override fun newImageLoader(context: PlatformContext): ImageLoader =
        ImageLoader.Builder(context)
            .components { add(OkHttpNetworkFetcherFactory()) }
            .crossfade(true)
            .build()
}
