package md.vadikonline1.gustbebe.data

import android.content.Context
import kotlinx.coroutines.flow.Flow
import md.vadikonline1.gustbebe.data.db.AppDatabase
import md.vadikonline1.gustbebe.data.db.FavoriteEntity

class RecipeRepository(private val context: Context) {
    private val db by lazy { AppDatabase.get(context) }
    private val session by lazy { SessionStore(context) }
    private val gson = com.google.gson.Gson()

    private suspend fun api(): ApiService = Network.init(context)

    // ---- rețete ----
    suspend fun recipes(params: Map<String, String>): Page<RecipeDto> =
        api().recipes(params)

    suspend fun recipe(slug: String): RecipeDto = api().recipe(slug)

    suspend fun random(category: String? = null, age: String? = null): RecipeDto =
        api().random(category, age)

    suspend fun popular(limit: Int = 6): List<RecipeDto> =
        api().recipes(mapOf("sort" to "popular", "limit" to limit.toString())).items

    // ---- taxonomii ----
    suspend fun ages() = api().ages()
    suspend fun feedingTypes() = api().feedingTypes()
    suspend fun categories(withCounts: Boolean = false) =
        api().categories(if (withCounts) "1" else null)
    suspend fun restrictions() = api().restrictions()

    // ---- ghid + config + stats ----
    suspend fun guide() = api().guide()
    suspend fun config() = try { api().config() } catch (_: Exception) { null }

    // ---- vot ----
    suspend fun vote(id: Int, value: Int): RateResponse {
        val user = session.user()
        return if (user != null) {
            api().rate(id, mapOf("value" to value))
        } else {
            val did = session.deviceId()
            api().guestRate(id, mapOf("value" to value.toString(), "deviceId" to did))
        }
    }

    suspend fun view(id: Int): ViewsResponse = try {
        api().view(id)
    } catch (_: Exception) { ViewsResponse(0, false) }

    // ---- favorite (server + local, fara cont obligatoriu) ----
    fun localFavorites(): Flow<List<FavoriteEntity>> = db.favorites().all()

    suspend fun serverFavorites(): List<RecipeDto> = try {
        if (session.user() != null) api().favorites() else emptyList()
    } catch (_: Exception) { emptyList() }

    suspend fun isFavorite(id: Int): Boolean {
        // starea server (isFavorite din detaliu) + cache local; verificarea e locala (rapida, offline)
        return db.favorites().byId(id) != null
    }

    suspend fun toggleFavorite(r: RecipeDto): Boolean {
        val local = db.favorites().byId(r.id)
        val user = session.user()
        if (user != null) {
            try {
                if (local != null || r.isFavorite) api().removeFavorite(r.id) else api().addFavorite(r.id)
            } catch (_: Exception) {}
        }
        if (local != null) {
            db.favorites().delete(r.id)
            return false
        }
        db.favorites().upsert(
            FavoriteEntity(r.id, r.slug, r.titleRo, r.titleRu, r.titleEn, r.imageUrl, r.avgRating, r.ratingsCount)
        )
        return true
    }

    suspend fun removeFavorite(id: Int) {
        if (session.user() != null) {
            try { api().removeFavorite(id) } catch (_: Exception) {}
        }
        db.favorites().delete(id)
    }

    suspend fun seedFavorite(r: RecipeDto) {
        if (db.favorites().byId(r.id) == null) {
            db.favorites().upsert(
                FavoriteEntity(r.id, r.slug, r.titleRo, r.titleRu, r.titleEn, r.imageUrl, r.avgRating, r.ratingsCount)
            )
        }
    }

    // ---- push nativ (FCM) ----
    suspend fun registerNativePush(token: String) {
        try {
            api().nativePushToken(mapOf("token" to token, "platform" to "fcm-android"))
        } catch (_: Exception) {
        }
    }

    // ---- auth ----
    suspend fun me(): UserDto {
        val me = api().me()
        session.setUser(me)
        return me
    }

    suspend fun login(email: String, password: String): UserDto {
        val res = api().login(mapOf("email" to email, "password" to password))
        val token = res.token ?: throw IllegalStateException("no token")
        session.setToken(token)
        val me = api().me()
        session.setUser(me)
        return me
    }

    suspend fun register(name: String, email: String, password: String): AuthResponse {
        val res = api().register(mapOf("name" to name, "email" to email, "password" to password))
        if (res.token != null) {
            session.setToken(res.token)
            session.setUser(res.user)
        }
        return res
    }

    suspend fun logout() {
        session.setToken(null)
        session.setUser(null)
    }

    suspend fun updateName(name: String): UserDto {
        val me = api().updateMe(mapOf("name" to name))
        session.setUser(me)
        return me
    }

    suspend fun changePassword(current: String, next: String) {
        api().changePassword(mapOf("currentPassword" to current, "newPassword" to next))
    }
}
