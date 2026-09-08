package md.vadikonline1.gustbebe.data

import android.content.Context
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import md.vadikonline1.gustbebe.data.db.AppDatabase
import md.vadikonline1.gustbebe.data.db.FavoriteEntity

// Limba UI: ro/ru/en — default romana, persistata local.
object Lang {
    const val RO = "ro"
    const val RU = "ru"
    const val EN = "en"
    val ALL = listOf(RO, RU, EN)

    fun label(code: String) = when (code) {
        RU -> "Ru"
        EN -> "En"
        else -> "Ro"
    }
}

private val STRINGS: Map<String, Map<String, String>> = mapOf(
    "appName" to mapOf("ro" to "GustBebe", "ru" to "GustBebe", "en" to "GustBebe"),
    "home" to mapOf("ro" to "Rețete", "ru" to "Рецепты", "en" to "Recipes"),
    "categories" to mapOf("ro" to "Categorii", "ru" to "Категории", "en" to "Categories"),
    "guide" to mapOf("ro" to "Ghid", "ru" to "Гид", "en" to "Guide"),
    "random" to mapOf("ro" to "Random", "ru" to "Случайно", "en" to "Random"),
    "favorites" to mapOf("ro" to "Favorit", "ru" to "Избранное", "en" to "Favorites"),
    "settings" to mapOf("ro" to "Setări", "ru" to "Настройки", "en" to "Settings"),
    "searchHint" to mapOf("ro" to "Caută rețetă...", "ru" to "Поиск рецепта...", "en" to "Search recipe..."),
    "filters" to mapOf("ro" to "Filtre", "ru" to "Фильтры", "en" to "Filters"),
    "filterActive" to mapOf("ro" to "Filtru activ", "ru" to "Фильтр активен", "en" to "Active filter"),
    "apply" to mapOf("ro" to "Aplică", "ru" to "Применить", "en" to "Apply"),
    "reset" to mapOf("ro" to "Resetează", "ru" to "Сбросить", "en" to "Reset"),
    "close" to mapOf("ro" to "Închide", "ru" to "Закрыть", "en" to "Close"),
    "age" to mapOf("ro" to "Vârstă", "ru" to "Возраст", "en" to "Age"),
    "feeding" to mapOf("ro" to "Tip alimentare", "ru" to "Тип питания", "en" to "Meal type"),
    "restrictions" to mapOf("ro" to "Restricții", "ru" to "Ограничения", "en" to "Restrictions"),
    "ingredients" to mapOf("ro" to "Ingrediente", "ru" to "Ингредиенты", "en" to "Ingredients"),
    "prep" to mapOf("ro" to "Preparare", "ru" to "Приготовление", "en" to "Preparation"),
    "vote" to mapOf("ro" to "Votează", "ru" to "Оценить", "en" to "Rate"),
    "save" to mapOf("ro" to "Salvează", "ru" to "Сохранить", "en" to "Save"),
    "saved" to mapOf("ro" to "Salvat", "ru" to "Сохранено", "en" to "Saved"),
    "details" to mapOf("ro" to "Detalii", "ru" to "Подробнее", "en" to "Details"),
    "anotherRecipe" to mapOf("ro" to "Altă rețetă", "ru" to "Другой рецепт", "en" to "Another recipe"),
    "popular" to mapOf("ro" to "Rețete populare", "ru" to "Популярные рецепты", "en" to "Popular recipes"),
    "recommended" to mapOf("ro" to "Rețete recomandate", "ru" to "Рекомендуемые рецепты", "en" to "Recommended recipes"),
    "guideTitle" to mapOf("ro" to "Ghid diversificare", "ru" to "Гид по прикорму", "en" to "Feeding guide"),
    "noFavorites" to mapOf("ro" to "Nicio rețetă salvată încă.", "ru" to "Пока ничего не сохранено.", "en" to "No saved recipes yet."),
    "login" to mapOf("ro" to "Autentificare", "ru" to "Вход", "en" to "Login"),
    "register" to mapOf("ro" to "Înregistrare", "ru" to "Регистрация", "en" to "Register"),
    "name" to mapOf("ro" to "Nume", "ru" to "Имя", "en" to "Name"),
    "email" to mapOf("ro" to "Email", "ru" to "Email", "en" to "Email"),
    "password" to mapOf("ro" to "Parolă", "ru" to "Пароль", "en" to "Password"),
    "doLogin" to mapOf("ro" to "Intră în cont", "ru" to "Войти", "en" to "Sign in"),
    "doRegister" to mapOf("ro" to "Creează contul", "ru" to "Создать аккаунт", "en" to "Create account"),
    "needVerify" to mapOf("ro" to "Verifică emailul pentru activare.", "ru" to "Подтвердите email.", "en" to "Check your email to activate."),
    "invalidLogin" to mapOf("ro" to "Date invalide sau cont neconfirmat.", "ru" to "Неверные данные.", "en" to "Invalid credentials."),
    "logout" to mapOf("ro" to "Ieși din cont", "ru" to "Выйти", "en" to "Log out"),
    "saveName" to mapOf("ro" to "Salvează numele", "ru" to "Сохранить имя", "en" to "Save name"),
    "newPassword" to mapOf("ro" to "Parola nouă", "ru" to "Новый пароль", "en" to "New password"),
    "currentPassword" to mapOf("ro" to "Parola curentă", "ru" to "Текущий пароль", "en" to "Current password"),
    "changePassword" to mapOf("ro" to "Schimbă parola", "ru" to "Сменить пароль", "en" to "Change password"),
    "savedOk" to mapOf("ro" to "Salvat ✓", "ru" to "Сохранено ✓", "en" to "Saved ✓"),
    "supportUs" to mapOf("ro" to "Susține proiectul", "ru" to "Поддержать проект", "en" to "Support the project"),
    "subscribeTg" to mapOf("ro" to "Abonează-te pe Telegram", "ru" to "Подписаться в Telegram", "en" to "Join on Telegram"),
    "about" to mapOf("ro" to "Despre", "ru" to "О нас", "en" to "About"),
    "aboutText" to mapOf(
        "ro" to "GustBebe — rețete sănătoase pentru bebeluși și copii mici.",
        "ru" to "GustBebe — полезные рецепты для малышей.",
        "en" to "GustBebe — healthy recipes for babies and toddlers."
    ),
    "language" to mapOf("ro" to "Limba", "ru" to "Язык", "en" to "Language"),
    "myFavorites" to mapOf("ro" to "Favoritele mele", "ru" to "Моё избранное", "en" to "My favorites"),
    "confirmDeleteFav" to mapOf("ro" to "Ștergi din favorite?", "ru" to "Убрать из избранного?", "en" to "Remove from favorites?"),
    "yes" to mapOf("ro" to "Da", "ru" to "Да", "en" to "Yes"),
    "cancel" to mapOf("ro" to "Anulează", "ru" to "Отмена", "en" to "Cancel"),
    "votes" to mapOf("ro" to "voturi", "ru" to "оценок", "en" to "votes"),
    "views" to mapOf("ro" to "vizionări", "ru" to "просмотров", "en" to "views"),
    "recipes" to mapOf("ro" to "rețete", "ru" to "рецептов", "en" to "recipes"),
    "loading" to mapOf("ro" to "Se încarcă...", "ru" to "Загрузка...", "en" to "Loading..."),
    "retry" to mapOf("ro" to "Reîncearcă", "ru" to "Повторить", "en" to "Retry"),
    "noConnection" to mapOf("ro" to "Fără conexiune la server.", "ru" to "Нет соединения.", "en" to "No connection."),
    "emptyRecipes" to mapOf("ro" to "Nicio rețetă găsită.", "ru" to "Рецепты не найдены.", "en" to "No recipes found.")
)

fun tr(key: String, lang: String): String {
    val row = STRINGS[key] ?: return key
    return row[lang] ?: row[Lang.RO] ?: key
}

// Limba curenta ca stare observabila (initializata la pornire din DataStore).
object UiLang {
    val flow = kotlinx.coroutines.flow.MutableStateFlow(Lang.RO)
    var current: String
        get() = flow.value
        set(v) { flow.value = v }
}

class SessionStore(context: Context) {
    private val prefs = Prefs(context)
    private val gson = Gson()

    suspend fun token(): String? = prefs.get(PrefsKeys.TOKEN)
    suspend fun setToken(t: String?) = prefs.set(PrefsKeys.TOKEN, t)
    suspend fun lang(): String = prefs.get(PrefsKeys.LANG) ?: Lang.RO
    suspend fun setLang(l: String) = prefs.set(PrefsKeys.LANG, l)
    suspend fun deviceId(): String = prefs.deviceId()

    suspend fun user(): UserDto? {
        val raw = prefs.get(PrefsKeys.USER_JSON) ?: return null
        return try { gson.fromJson(raw, UserDto::class.java) } catch (_: Exception) { null }
    }

    suspend fun setUser(u: UserDto?) = prefs.set(PrefsKeys.USER_JSON, u?.let { gson.toJson(it) })

    fun favorites(db: AppDatabase) = db.favorites().all()
}
