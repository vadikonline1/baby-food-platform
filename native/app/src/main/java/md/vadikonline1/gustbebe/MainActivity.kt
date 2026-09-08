package md.vadikonline1.gustbebe

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import md.vadikonline1.gustbebe.data.UiTheme
import md.vadikonline1.gustbebe.ui.AppRoot
import md.vadikonline1.gustbebe.ui.theme.GustBebeTheme

// Deep link din notificari push (gustbebe://detail?slug=...) — consumat de AppRoot la resume.
object DeepLink {
    @Volatile var pending: String? = null
}

class MainActivity : ComponentActivity() {
    private val notifPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleDeepIntent(intent)
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            try {
                notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            } catch (_: Exception) {
            }
        }
        enableEdgeToEdge()
        setContent {
            val mode by UiTheme.flow.collectAsState()
            GustBebeTheme(
                dark = mode == UiTheme.DARK || (mode == UiTheme.SYSTEM && isSystemInDarkTheme())
            ) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AppRoot()
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleDeepIntent(intent)
    }

    private fun handleDeepIntent(intent: Intent?) {
        val d = intent?.data ?: return
        if (d.scheme != "gustbebe") return
        val slug = d.getQueryParameter("slug")?.takeIf { it.isNotBlank() }
            ?: d.pathSegments.lastOrNull { it.isNotBlank() && it != "detail" }
        if (!slug.isNullOrBlank()) DeepLink.pending = slug
    }
}
