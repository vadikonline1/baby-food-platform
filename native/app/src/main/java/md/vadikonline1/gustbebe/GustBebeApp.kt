package md.vadikonline1.gustbebe

import android.app.Application
import com.google.android.gms.ads.MobileAds
import md.vadikonline1.gustbebe.data.Network
import md.vadikonline1.gustbebe.data.RecipeRepository

class GustBebeApp : Application() {
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
}
