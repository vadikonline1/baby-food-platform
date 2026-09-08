package md.vadikonline1.gustbebe

import android.app.Application
import coil3.ImageLoader
import coil3.PlatformContext
import coil3.SingletonImageLoader
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import coil3.request.crossfade
import com.google.android.gms.ads.MobileAds
import md.vadikonline1.gustbebe.data.RecipeRepository

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
    }

    // Fara fetcher de retea, Coil3 nu incarca URL-uri http(s) — de aici imaginile goale.
    override fun newImageLoader(context: PlatformContext): ImageLoader =
        ImageLoader.Builder(context)
            .components { add(OkHttpNetworkFetcherFactory()) }
            .crossfade(true)
            .build()
}
