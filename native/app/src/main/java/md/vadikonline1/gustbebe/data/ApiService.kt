package md.vadikonline1.gustbebe.data

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.QueryMap

interface ApiService {
    @GET("recipes")
    suspend fun recipes(@QueryMap params: Map<String, String>): Page<RecipeDto>

    @GET("recipes/{slug}")
    suspend fun recipe(@Path("slug") slug: String): RecipeDto

    @GET("recipes/random")
    suspend fun random(
        @Query("category") category: String? = null,
        @Query("age") age: String? = null
    ): RecipeDto

    @GET("taxonomies/ages")
    suspend fun ages(): List<TaxItem>

    @GET("taxonomies/feeding-types")
    suspend fun feedingTypes(): List<TaxItem>

    @GET("taxonomies/categories")
    suspend fun categories(@Query("withCounts") withCounts: String? = null): List<TaxItem>

    @GET("taxonomies/restrictions")
    suspend fun restrictions(): List<TaxItem>

    @GET("taxonomies/characteristics")
    suspend fun characteristics(): List<TaxItem>

    @GET("content/guide")
    suspend fun guide(): List<GuideItemDto>

    @GET("settings/config")
    suspend fun config(): RemoteConfig

    @GET("stats")
    suspend fun stats(): StatsDto

    @POST("auth/register")
    suspend fun register(@Body body: Map<String, String>): AuthResponse

    @POST("auth/login")
    suspend fun login(@Body body: Map<String, String>): AuthResponse

    @GET("auth/me")
    suspend fun me(): UserDto

    @PATCH("auth/me")
    suspend fun updateMe(@Body body: Map<String, String?>): UserDto

    @PATCH("auth/me/password")
    suspend fun changePassword(@Body body: Map<String, String>): OkResponse

    @POST("recipes/{id}/rate")
    suspend fun rate(@Path("id") id: Int, @Body body: Map<String, Int>): RateResponse

    @POST("recipes/{id}/guest-rate")
    suspend fun guestRate(@Path("id") id: Int, @Body body: Map<String, String>): RateResponse

    @POST("recipes/{id}/favorite")
    suspend fun addFavorite(@Path("id") id: Int): OkResponse

    @DELETE("recipes/{id}/favorite")
    suspend fun removeFavorite(@Path("id") id: Int): OkResponse

    @GET("users/me/favorites")
    suspend fun favorites(): List<RecipeDto>

    @POST("recipes/{id}/view")
    suspend fun view(@Path("id") id: Int): ViewsResponse
}
