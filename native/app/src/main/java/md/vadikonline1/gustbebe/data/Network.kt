package md.vadikonline1.gustbebe.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.UUID
import java.util.concurrent.TimeUnit

private val Context.dataStore by preferencesDataStore("gustbebe")

object PrefsKeys {
    val TOKEN = stringPreferencesKey("token")
    val LANG = stringPreferencesKey("lang")
    val API_BASE = stringPreferencesKey("api_base")
    val DEVICE_ID = stringPreferencesKey("device_id")
    val USER_JSON = stringPreferencesKey("user_json")
}

class Prefs(private val context: Context) {
    suspend fun get(key: androidx.datastore.preferences.core.Preferences.Key<String>): String? {
        return context.dataStore.data.map { it[key] }.first()
    }

    suspend fun set(key: androidx.datastore.preferences.core.Preferences.Key<String>, value: String?) {
        context.dataStore.edit {
            if (value == null) it.remove(key) else it[key] = value
        }
    }

    suspend fun deviceId(): String {
        var id = get(PrefsKeys.DEVICE_ID)
        if (id.isNullOrBlank()) {
            id = "dev-" + UUID.randomUUID().toString().take(24)
            set(PrefsKeys.DEVICE_ID, id)
        }
        return id
    }
}

object DnsResolver {
    const val DNS_SOURCE = "https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns"
    const val DNS_KEY = "md.vadikonline1.gustbebe"
    const val FALLBACK_BASE = "https://gustbebe.aalto.md/api"

    suspend fun resolve(prefs: Prefs): String {
        var base = prefs.get(PrefsKeys.API_BASE) ?: FALLBACK_BASE
        try {
            val client = OkHttpClient.Builder()
                .callTimeout(8, TimeUnit.SECONDS)
                .connectTimeout(8, TimeUnit.SECONDS)
                .build()
            val req = okhttp3.Request.Builder().url(DNS_SOURCE).get().build()
            client.newCall(req).execute().use { res ->
                val text = try {
                    res.peekBody(Long.MAX_VALUE).string()
                } catch (_: Exception) {
                    ""
                }
                val line = text.lines().map { it.trim() }.firstOrNull { it.startsWith("$DNS_KEY=") }
                val dns = line?.substringAfter("=")?.trim().orEmpty()
                if (dns.isNotEmpty()) {
                    base = "https://$dns/api"
                    prefs.set(PrefsKeys.API_BASE, base)
                }
            }
        } catch (_: Exception) {
        }
        return base.ensureApi()
    }

    fun String.ensureApi(): String {
        val b = this.trim().removeSuffix("/")
        return if (b.endsWith("/api")) b else "$b/api"
    }
}

object Network {
    @Volatile private var service: ApiService? = null
    @Volatile private var base: String = DnsResolver.FALLBACK_BASE

    suspend fun init(context: Context): ApiService {
        val prefs = Prefs(context.applicationContext)
        base = DnsResolver.resolve(prefs)
        return service ?: synchronized(this) {
            service ?: build(prefs).also { service = it }
        }
    }

    fun current(): ApiService = service ?: buildRaw(base)

    private fun build(prefs: Prefs): ApiService = buildRaw(null, prefs)

    private fun buildRaw(fixedBase: String?, prefs: Prefs? = null): ApiService {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val req = chain.request()
                val token = try {
                    kotlinx.coroutines.runBlocking { prefs?.get(PrefsKeys.TOKEN) }
                } catch (_: Exception) { null }
                val b = req.newBuilder()
                if (!token.isNullOrBlank()) b.header("Authorization", "Bearer $token")
                chain.proceed(b.build())
            }
            .build()
        return Retrofit.Builder()
            .baseUrl((fixedBase ?: base).let { if (it.endsWith("/")) it else "$it/" })
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(Gson()))
            .build()
            .create(ApiService::class.java)
    }

    fun absoluteImage(imageUrl: String?): String? {
        if (imageUrl.isNullOrBlank()) return null
        if (imageUrl.startsWith("http")) return imageUrl
        val host = base.removeSuffix("/api").removeSuffix("/")
        return host + (if (imageUrl.startsWith("/")) imageUrl else "/$imageUrl")
    }
}
