package md.vadikonline1.gustbebe.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import md.vadikonline1.gustbebe.GustBebeApp
import md.vadikonline1.gustbebe.data.Lang
import md.vadikonline1.gustbebe.data.RecipeDto
import md.vadikonline1.gustbebe.data.RecipeRepository
import md.vadikonline1.gustbebe.data.RemoteConfig
import md.vadikonline1.gustbebe.data.SessionStore
import md.vadikonline1.gustbebe.data.TaxItem
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.UserDto
import md.vadikonline1.gustbebe.data.db.FavoriteEntity

@Composable
inline fun <reified T : ViewModel> appViewModel(noinline make: (RecipeRepository) -> T): T {
    val app = LocalContext.current.applicationContext as GustBebeApp
    return viewModel(factory = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <M : ViewModel> create(modelClass: Class<M>): M = make(app.repo) as M
    })
}

data class RecipeFilters(
    val ages: Set<Int> = emptySet(),
    val feedings: Set<Int> = emptySet(),
    val categories: Set<String> = emptySet(),
    val restrictions: Set<String> = emptySet()
) {
    fun isEmpty() = ages.isEmpty() && feedings.isEmpty() && categories.isEmpty() && restrictions.isEmpty()
    fun count() = ages.size + feedings.size + categories.size + restrictions.size
    fun toParams(): Map<String, String> {
        val m = mutableMapOf<String, String>()
        if (ages.isNotEmpty()) m["age"] = ages.joinToString(",")
        if (feedings.isNotEmpty()) m["feeding"] = feedings.joinToString(",")
        if (categories.isNotEmpty()) m["category"] = categories.joinToString(",")
        if (restrictions.isNotEmpty()) m["restriction"] = restrictions.joinToString(",")
        return m
    }
}

class RecipesViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _items = MutableStateFlow<List<RecipeDto>>(emptyList())
    val items: StateFlow<List<RecipeDto>> = _items.asStateFlow()
    private val _total = MutableStateFlow(0)
    val total: StateFlow<Int> = _total.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    var query = ""
    var filters = RecipeFilters()

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            try {
                val params = filters.toParams().toMutableMap()
                if (query.isNotBlank()) params["q"] = query
                params["limit"] = "30"
                val page = repo.recipes(params)
                _items.value = page.items
                _total.value = page.total
            } catch (_: Exception) {
            } finally {
                _loading.value = false
            }
        }
    }

    fun toggleFav(r: RecipeDto) {
        viewModelScope.launch {
            try {
                val now = repo.toggleFavorite(r)
                _items.value = _items.value.map { if (it.id == r.id) it.copy(isFavorite = now) else it }
            } catch (_: Exception) {
            }
        }
    }
}

class TaxViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _ages = MutableStateFlow<List<TaxItem>>(emptyList())
    val ages: StateFlow<List<TaxItem>> = _ages.asStateFlow()
    private val _feedings = MutableStateFlow<List<TaxItem>>(emptyList())
    val feedings: StateFlow<List<TaxItem>> = _feedings.asStateFlow()
    private val _cats = MutableStateFlow<List<TaxItem>>(emptyList())
    val cats: StateFlow<List<TaxItem>> = _cats.asStateFlow()
    private val _restrs = MutableStateFlow<List<TaxItem>>(emptyList())
    val restrs: StateFlow<List<TaxItem>> = _restrs.asStateFlow()

    fun load(withCounts: Boolean = false) {
        viewModelScope.launch {
            try {
                _ages.value = repo.ages()
                _feedings.value = repo.feedingTypes()
                _cats.value = repo.categories(withCounts)
                _restrs.value = repo.restrictions()
            } catch (_: Exception) {
            }
        }
    }
}

class DetailViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _recipe = MutableStateFlow<RecipeDto?>(null)
    val recipe: StateFlow<RecipeDto?> = _recipe.asStateFlow()
    private val _myVote = MutableStateFlow(0)
    val myVote: StateFlow<Int> = _myVote.asStateFlow()
    private val _fav = MutableStateFlow(false)
    val fav: StateFlow<Boolean> = _fav.asStateFlow()

    fun load(slug: String) {
        viewModelScope.launch {
            try {
                val r = repo.recipe(slug)
                _recipe.value = r
                _myVote.value = r.myRating
                var f = r.isFavorite
                if (!f) f = repo.isFavorite(r.id)
                else repo.seedFavorite(r)
                _fav.value = f
                val v = repo.view(r.id)
                _recipe.value = r.copy(viewsCount = v.views)
            } catch (_: Exception) {
            }
        }
    }

    fun vote(v: Int) {
        val r = _recipe.value ?: return
        _myVote.value = v
        viewModelScope.launch {
            try {
                val res = repo.vote(r.id, v)
                _recipe.value = r.copy(avgRating = res.avgRating, ratingsCount = res.ratingsCount)
            } catch (_: Exception) {
            }
        }
    }

    fun toggleFav() {
        val r = _recipe.value ?: return
        viewModelScope.launch {
            try {
                _fav.value = repo.toggleFavorite(r)
            } catch (_: Exception) {
            }
        }
    }
}

class GuideViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _items = MutableStateFlow<List<md.vadikonline1.gustbebe.data.GuideItemDto>>(emptyList())
    val items: StateFlow<List<md.vadikonline1.gustbebe.data.GuideItemDto>> = _items.asStateFlow()

    fun load() {
        viewModelScope.launch {
            try {
                _items.value = repo.guide()
            } catch (_: Exception) {
            }
        }
    }
}

class PopularViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _items = MutableStateFlow<List<RecipeDto>>(emptyList())
    val items: StateFlow<List<RecipeDto>> = _items.asStateFlow()

    fun load() {
        viewModelScope.launch {
            try {
                _items.value = repo.popular(5)
            } catch (_: Exception) {
            }
        }
    }
}

class RandomViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _recipe = MutableStateFlow<RecipeDto?>(null)
    val recipe: StateFlow<RecipeDto?> = _recipe.asStateFlow()

    fun load() {
        _recipe.value = null
        viewModelScope.launch {
            try {
                _recipe.value = repo.random()
            } catch (_: Exception) {
            }
        }
    }
}

class FavoritesViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _items = MutableStateFlow<List<RecipeDto>>(emptyList())
    val items: StateFlow<List<RecipeDto>> = _items.asStateFlow()

    fun load() {
        viewModelScope.launch {
            try {
                val server = repo.serverFavorites()
                val serverIds = server.map { it.id }.toSet()
                val local = mutableListOf<RecipeDto>()
                try {
                    repo.localFavorites().first().forEach { e ->
                        if (e.id !in serverIds) {
                            local.add(RecipeDto(e.id, e.slug, e.titleRo, e.titleRu, e.titleEn, imageUrl = e.imageUrl, avgRating = e.avgRating, ratingsCount = e.ratingsCount))
                        }
                    }
                } catch (_: Exception) {
                }
                _items.value = server + local
            } catch (_: Exception) {
            }
        }
    }

    fun remove(id: Int) {
        viewModelScope.launch {
            try {
                repo.removeFavorite(id)
                load()
            } catch (_: Exception) {
            }
        }
    }
}

class SettingsViewModel(private val repo: RecipeRepository) : ViewModel() {
    val lang = UiLang.flow
    private val _config = MutableStateFlow<RemoteConfig?>(null)
    val config: StateFlow<RemoteConfig?> = _config.asStateFlow()

    fun loadConfig() {
        viewModelScope.launch {
            try {
                _config.value = repo.config()
            } catch (_: Exception) {
            }
        }
    }

    fun setLang(context: android.content.Context, code: String) {
        viewModelScope.launch {
            try {
                SessionStore(context).setLang(code)
            } catch (_: Exception) {
            }
            UiLang.current = code
        }
    }
}

class AuthViewModel(private val repo: RecipeRepository) : ViewModel() {
    private val _user = MutableStateFlow<UserDto?>(null)
    val user: StateFlow<UserDto?> = _user.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    private val _pendingVerify = MutableStateFlow(false)
    val pendingVerify: StateFlow<Boolean> = _pendingVerify.asStateFlow()

    fun init(context: android.content.Context) {
        viewModelScope.launch {
            try {
                _user.value = SessionStore(context).user()
                if (_user.value != null) {
                    _user.value = repo.me()
                }
            } catch (_: Exception) {
            }
        }
    }

    fun login(email: String, password: String, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                _user.value = repo.login(email, password)
                _error.value = null
            } catch (e: Exception) {
                onError((e as? retrofit2.HttpException)?.code()?.let { if (it == 403) "unverified" else "invalid" } ?: "invalid")
            }
        }
    }

    fun register(name: String, email: String, password: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val res = repo.register(name, email, password)
                if (res.token != null) {
                    _user.value = res.user ?: repo.me()
                    onDone(true)
                } else {
                    _pendingVerify.value = true
                    onDone(false)
                }
            } catch (e: Exception) {
                onDone(false)
                _error.value = "invalid"
            }
        }
    }

    fun logout(context: android.content.Context) {
        viewModelScope.launch {
            try {
                repo.logout()
            } catch (_: Exception) {
            }
            _user.value = null
        }
    }

    fun saveName(name: String, onOk: () -> Unit, onErr: () -> Unit) {
        viewModelScope.launch {
            try {
                _user.value = repo.updateName(name)
                onOk()
            } catch (_: Exception) {
                onErr()
            }
        }
    }

    fun savePassword(cur: String, next: String, onOk: () -> Unit, onErr: () -> Unit) {
        viewModelScope.launch {
            try {
                repo.changePassword(cur, next)
                onOk()
            } catch (_: Exception) {
                onErr()
            }
        }
    }
}
