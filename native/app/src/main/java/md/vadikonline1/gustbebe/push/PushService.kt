package md.vadikonline1.gustbebe.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import md.vadikonline1.gustbebe.MainActivity
import md.vadikonline1.gustbebe.R
import md.vadikonline1.gustbebe.data.Prefs
import md.vadikonline1.gustbebe.data.PrefsKeys
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

// Push nativ via FCM (fara Expo): tokenul se inregistreaza la /api/push/native-tokens,
// mesajele de la retete noi deschid direct reteta (deep link gustbebe://).
class PushService : FirebaseMessagingService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        scope.launch { uploadToken(applicationContext, token) }
    }

    override fun onMessageReceived(msg: RemoteMessage) {
        val n = msg.notification
        val title = n?.title ?: msg.data["title"] ?: "GustBebe"
        val body = n?.body ?: msg.data["body"] ?: return
        val slug = msg.data["slug"]?.takeIf { it.isNotBlank() }
            ?: msg.data["url"]?.substringAfterLast('/')?.takeIf { it.isNotBlank() && it != "url" }
        showNotification(title, body, slug)
    }

    private fun showNotification(title: String, body: String, slug: String?) {
        val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mgr.createNotificationChannel(
                NotificationChannel(CHANNEL, "Rețete noi", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
        val uri = Uri.parse("gustbebe://detail").buildUpon().apply {
            if (!slug.isNullOrBlank()) appendQueryParameter("slug", slug)
        }.build()
        val intent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = uri
        }
        val pi = PendingIntent.getActivity(
            this, System.currentTimeMillis().toInt(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notif = NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_push)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build()
        mgr.notify(System.currentTimeMillis().toInt(), notif)
    }

    companion object {
        const val CHANNEL = "gustbebe_retete"

        suspend fun uploadToken(context: Context, token: String) {
            try {
                val prefs = Prefs(context.applicationContext)
                if (prefs.get(PrefsKeys.PUSH_TOKEN_SENT) == token) return
                var base = (prefs.get(PrefsKeys.API_BASE) ?: DnsResolverFallback).trim().removeSuffix("/")
                if (!base.endsWith("/api")) base += "/api"
                val json = "{\"token\":\"$token\",\"platform\":\"fcm-android\"}"
                val client = OkHttpClient.Builder().callTimeout(15, TimeUnit.SECONDS).build()
                val req = Request.Builder()
                    .url("$base/push/native-tokens")
                    .post(json.toRequestBody("application/json".toMediaType()))
                    .build()
                client.newCall(req).execute().use { res ->
                    if (res.isSuccessful) prefs.set(PrefsKeys.PUSH_TOKEN_SENT, token)
                }
            } catch (_: Exception) {
            }
        }

        private const val DnsResolverFallback = "https://gustbebe.aalto.md/api"
    }
}
