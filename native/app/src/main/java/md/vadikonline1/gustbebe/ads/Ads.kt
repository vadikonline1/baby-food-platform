package md.vadikonline1.gustbebe.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAd
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAdLoadCallback
import md.vadikonline1.gustbebe.data.RemoteConfig

// Reclame AdMob: Banner la finalul retetei; Susține -> Intercalat cu recompensa, fallback Cu recompensa.
// Unit-urile vin din remote config (Admin web). App ID-ul e build-time (AndroidManifest).
object Ads {
    data class Units(val banner: String, val rewardedInterstitial: String, val rewarded: String)

    fun units(cfg: RemoteConfig?): Units {
        val a = cfg?.admob?.android
        return Units(a?.banner.orEmpty(), a?.rewardedInterstitial.orEmpty(), a?.rewarded.orEmpty())
    }

    fun bannerUnit(cfg: RemoteConfig?): String = units(cfg).banner

    fun showRewardedFlow(activity: Activity, cfg: RemoteConfig?, onDone: (rewarded: Boolean) -> Unit) {
        val units = cfg?.admob?.android
        val ri = units?.rewardedInterstitial.orEmpty()
        val rw = units?.rewarded.orEmpty()
        if (ri.isNotBlank()) {
            RewardedInterstitialAd.load(activity, ri, AdRequest.Builder().build(),
                object : RewardedInterstitialAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedInterstitialAd) {
                        ad.show(activity) { onDone(true) }
                    }

                    override fun onAdFailedToLoad(e: LoadAdError) {
                        showRewarded(activity, rw, onDone)
                    }
                })
        } else {
            showRewarded(activity, rw, onDone)
        }
    }

    private fun showRewarded(activity: Activity, unit: String, onDone: (Boolean) -> Unit) {
        if (unit.isBlank()) {
            onDone(false)
            return
        }
        RewardedAd.load(activity, unit, AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    ad.show(activity) { onDone(true) }
                }

                override fun onAdFailedToLoad(e: LoadAdError) {
                    onDone(false)
                }
            })
    }

    fun openTelegram(context: Context, url: String) {
        try {
            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }
}
