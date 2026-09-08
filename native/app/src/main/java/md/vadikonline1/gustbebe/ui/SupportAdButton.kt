package md.vadikonline1.gustbebe.ui

import android.app.Activity
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAd
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAdLoadCallback
import md.vadikonline1.gustbebe.ads.Ads
import md.vadikonline1.gustbebe.data.RemoteConfig
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

// Buton "Susține proiectul": Intercalat cu recompensa, fallback Cu recompensa.
@Composable
fun SupportAdButton(cfg: RemoteConfig?, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val activity = context as? Activity
    val units = remember(cfg) { Ads.units(cfg) }
    Button(
        onClick = {
            val act = activity ?: return@Button
            val ri = units.rewardedInterstitial
            val rw = units.rewarded
            if (ri.isNotBlank()) {
                RewardedInterstitialAd.load(act, ri, AdRequest.Builder().build(),
                    object : RewardedInterstitialAdLoadCallback() {
                        override fun onAdLoaded(ad: RewardedInterstitialAd) {
                            ad.show(act) {}
                        }

                        override fun onAdFailedToLoad(e: com.google.android.gms.ads.LoadAdError) {
                            showRewarded(act, rw)
                        }
                    })
            } else {
                showRewarded(act, rw)
            }
        },
        shape = RoundedCornerShape(100.dp),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
        modifier = modifier.fillMaxWidth()
    ) {
        Text("🎁 ${tr("supportUs", UiLang.current)}")
    }
}

private fun showRewarded(activity: Activity, unit: String) {
    if (unit.isBlank()) return
    RewardedAd.load(activity, unit, AdRequest.Builder().build(),
        object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                ad.show(activity) {}
            }

            override fun onAdFailedToLoad(e: com.google.android.gms.ads.LoadAdError) {
            }
        })
}
