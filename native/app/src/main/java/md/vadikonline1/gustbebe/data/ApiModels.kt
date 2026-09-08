package md.vadikonline1.gustbebe.data

import com.google.gson.annotations.SerializedName

data class Page<T>(
    @SerializedName("total") val total: Int = 0,
    @SerializedName("page") val page: Int = 1,
    @SerializedName("limit") val limit: Int = 12,
    @SerializedName("items") val items: List<T> = emptyList()
)

data class LocalizedRef(
    @SerializedName("nameRo") val nameRo: String? = null,
    @SerializedName("nameRu") val nameRu: String? = null,
    @SerializedName("nameEn") val nameEn: String? = null,
    @SerializedName("labelRo") val labelRo: String? = null,
    @SerializedName("labelRu") val labelRu: String? = null,
    @SerializedName("labelEn") val labelEn: String? = null,
    @SerializedName("slug") val slug: String? = null,
    @SerializedName("icon") val icon: String? = null
) {
    fun label(lang: String): String {
        val cap = lang.replaceFirstChar { it.uppercase() }
        return when (cap) {
            "Ru" -> nameRu ?: labelRu ?: nameRo ?: labelRo ?: ""
            "En" -> nameEn ?: labelEn ?: nameRo ?: labelRo ?: ""
            else -> nameRo ?: labelRo ?: nameRu ?: labelRu ?: nameEn ?: labelEn ?: ""
        }
    }
}

data class RecipeIngredientDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("quantity") val quantity: Double? = null,
    @SerializedName("unit") val unit: String? = null,
    @SerializedName("noteRo") val noteRo: String? = null,
    @SerializedName("noteRu") val noteRu: String? = null,
    @SerializedName("noteEn") val noteEn: String? = null,
    @SerializedName("ingredient") val ingredient: LocalizedRef? = null
) {
    fun note(lang: String): String {
        val cap = lang.replaceFirstChar { it.uppercase() }
        return when (cap) {
            "Ru" -> noteRu ?: noteRo ?: ""
            "En" -> noteEn ?: noteRo ?: ""
            else -> noteRo ?: noteRu ?: noteEn ?: ""
        }
    }
}

data class RecipeDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("slug") val slug: String = "",
    @SerializedName("titleRo") val titleRo: String = "",
    @SerializedName("titleRu") val titleRu: String? = null,
    @SerializedName("titleEn") val titleEn: String? = null,
    @SerializedName("summaryRo") val summaryRo: String? = null,
    @SerializedName("summaryRu") val summaryRu: String? = null,
    @SerializedName("summaryEn") val summaryEn: String? = null,
    @SerializedName("ingredientsRo") val ingredientsRo: String = "",
    @SerializedName("ingredientsRu") val ingredientsRu: String? = null,
    @SerializedName("ingredientsEn") val ingredientsEn: String? = null,
    @SerializedName("stepsRo") val stepsRo: String = "",
    @SerializedName("stepsRu") val stepsRu: String? = null,
    @SerializedName("stepsEn") val stepsEn: String? = null,
    @SerializedName("prepMinutes") val prepMinutes: Int = 0,
    @SerializedName("cookMinutes") val cookMinutes: Int = 0,
    @SerializedName("servings") val servings: Int = 0,
    @SerializedName("difficulty") val difficulty: String? = null,
    @SerializedName("imageUrl") val imageUrl: String? = null,
    @SerializedName("status") val status: String = "PUBLISHED",
    @SerializedName("avgRating") val avgRating: Double = 0.0,
    @SerializedName("ratingsCount") val ratingsCount: Int = 0,
    @SerializedName("viewsCount") val viewsCount: Int = 0,
    @SerializedName("myRating") val myRating: Int = 0,
    @SerializedName("isFavorite") val isFavorite: Boolean = false,
    @SerializedName("feedingType") val feedingType: LocalizedRef? = null,
    @SerializedName("ageGroups") val ageGroups: List<AgeLink> = emptyList(),
    @SerializedName("categories") val categories: List<CatLink> = emptyList(),
    @SerializedName("restrictions") val restrictions: List<RestLink> = emptyList(),
    @SerializedName("ingredientsDetailed") val ingredientsDetailed: List<RecipeIngredientDto> = emptyList(),
    @SerializedName("author") val author: AuthorRef? = null
) {
    fun title(lang: String) = pick(lang, titleRo, titleRu, titleEn)
    fun summary(lang: String) = pick(lang, summaryRo, summaryRu, summaryEn)
    fun ingredients(lang: String) = pick(lang, ingredientsRo, ingredientsRu, ingredientsEn)
    fun steps(lang: String) = pick(lang, stepsRo, stepsRu, stepsEn)
    fun stepsList(lang: String) = steps(lang).split("\n").map { it.trim() }.filter { it.isNotEmpty() }
    fun imageAbsolute(appBase: String): String? {
        val u = imageUrl ?: return null
        if (u.startsWith("http")) return u
        val host = appBase.removeSuffix("/api").removeSuffix("/")
        return host + (if (u.startsWith("/")) u else "/$u")
    }
}

data class AgeLink(@SerializedName("ageGroup") val ageGroup: LocalizedRef? = null)
data class CatLink(@SerializedName("category") val category: LocalizedRef? = null)
data class RestLink(@SerializedName("restriction") val restriction: LocalizedRef? = null)
data class AuthorRef(@SerializedName("name") val name: String? = null)

private fun pick(lang: String, ro: String?, ru: String?, en: String?): String {
    return when (lang.replaceFirstChar { it.uppercase() }) {
        "Ru" -> ru ?: ro ?: ""
        "En" -> en ?: ro ?: ""
        else -> ro ?: ru ?: en ?: ""
    } ?: ""
}

data class TaxItem(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("slug") val slug: String? = null,
    @SerializedName("icon") val icon: String? = null,
    @SerializedName("nameRo") val nameRo: String? = null,
    @SerializedName("nameRu") val nameRu: String? = null,
    @SerializedName("nameEn") val nameEn: String? = null,
    @SerializedName("labelRo") val labelRo: String? = null,
    @SerializedName("labelRu") val labelRu: String? = null,
    @SerializedName("labelEn") val labelEn: String? = null,
    @SerializedName("minMonths") val minMonths: Int? = null,
    @SerializedName("maxMonths") val maxMonths: Int? = null,
    @SerializedName("_count") val count: CountWrap? = null
) {
    fun label(lang: String): String {
        val cap = lang.replaceFirstChar { it.uppercase() }
        val n = when (cap) {
            "Ru" -> nameRu ?: labelRu ?: nameRo ?: labelRo
            "En" -> nameEn ?: labelEn ?: nameRo ?: labelRo
            else -> nameRo ?: labelRo ?: nameRu ?: labelRu ?: nameEn ?: labelEn
        }
        return n ?: ""
    }
}

data class CountWrap(@SerializedName("recipes") val recipes: Int = 0)

data class GuideItemDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("icon") val icon: String = "",
    @SerializedName("titleRo") val titleRo: String = "",
    @SerializedName("titleRu") val titleRu: String? = null,
    @SerializedName("titleEn") val titleEn: String? = null,
    @SerializedName("bodyRo") val bodyRo: String = "",
    @SerializedName("bodyRu") val bodyRu: String? = null,
    @SerializedName("bodyEn") val bodyEn: String? = null
) {
    fun title(lang: String) = pick(lang, titleRo, titleRu, titleEn)
    fun body(lang: String) = pick(lang, bodyRo, bodyRu, bodyEn)
}

data class RemoteConfig(
    @SerializedName("admob") val admob: AdmobCfg? = null,
    @SerializedName("support") val support: SupportCfg? = null,
    @SerializedName("telegram") val telegram: TelegramCfg? = null
)

data class AdmobCfg(
    @SerializedName("android") val android: AdmobUnits? = null,
    @SerializedName("ios") val ios: AdmobUnits? = null
)

data class AdmobUnits(
    @SerializedName("banner") val banner: String = "",
    @SerializedName("rewardedInterstitial") val rewardedInterstitial: String = "",
    @SerializedName("rewarded") val rewarded: String = ""
)

data class SupportCfg(
    @SerializedName("enabled") val enabled: Boolean = false,
    @SerializedName("title") val title: Map<String, String> = emptyMap(),
    @SerializedName("text") val text: Map<String, String> = emptyMap()
)

data class TelegramCfg(@SerializedName("channelUrl") val channelUrl: String = "")

data class UserDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("name") val name: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("role") val role: String = "USER",
    @SerializedName("lang") val lang: String = "ro"
)

data class AuthResponse(
    @SerializedName("token") val token: String? = null,
    @SerializedName("user") val user: UserDto? = null,
    @SerializedName("ok") val ok: Boolean? = null,
    @SerializedName("pendingVerification") val pendingVerification: Boolean? = null
)

data class RateResponse(
    @SerializedName("avgRating") val avgRating: Double = 0.0,
    @SerializedName("ratingsCount") val ratingsCount: Int = 0
)

data class ViewsResponse(
    @SerializedName("views") val views: Int = 0,
    @SerializedName("counted") val counted: Boolean = false
)

data class StatsDto(
    @SerializedName("recipes") val recipes: Int = 0,
    @SerializedName("categories") val categories: Int = 0,
    @SerializedName("ratings") val ratings: Int = 0
)

data class OkResponse(@SerializedName("ok") val ok: Boolean = false)
