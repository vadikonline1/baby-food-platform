package md.vadikonline1.gustbebe.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import md.vadikonline1.gustbebe.ads.Ads
import md.vadikonline1.gustbebe.data.Network
import md.vadikonline1.gustbebe.data.RecipeDto
import md.vadikonline1.gustbebe.data.RemoteConfig
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

@Composable
fun DetailScreen(slug: String, nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val vm: DetailViewModel = appViewModel(::DetailViewModel)
    val r by vm.recipe.collectAsState()
    val myVote by vm.myVote.collectAsState()
    val fav by vm.fav.collectAsState()
    val cfgVm: SettingsViewModel = appViewModel(::SettingsViewModel)
    val cfg by cfgVm.config.collectAsState()

    LaunchedEffect(slug) {
        vm.load(slug)
        cfgVm.loadConfig()
    }

    val recipe = r
    if (recipe == null) {
        LoadingRow()
        return
    }
    DetailBody(
        r = recipe,
        lang = lang,
        myVote = myVote,
        fav = fav,
        cfg = cfg,
        onVote = { vm.vote(it) },
        onFav = { vm.toggleFav() }
    )
}

@Composable
fun DetailBody(
    r: RecipeDto,
    lang: String,
    myVote: Int,
    fav: Boolean,
    cfg: RemoteConfig?,
    onVote: (Int) -> Unit,
    onFav: () -> Unit
) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(r.title(lang), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(6.dp))
        Text(
            "⭐ ${"%.1f".format(r.avgRating)} (${r.ratingsCount}) · ⏱ ${r.prepMinutes + r.cookMinutes} min · 🍽 ${r.servings} · 👁 ${r.viewsCount}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(10.dp))
        Network.absoluteImage(r.imageUrl)?.let { url ->
            Card(shape = RoundedCornerShape(20.dp)) {
                AsyncImage(
                    model = url,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp)
                )
            }
            Spacer(Modifier.height(10.dp))
        }
        if (r.summary(lang).isNotBlank()) {
            Text(r.summary(lang), style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(10.dp))
        }
        Row {
            r.ageGroups.forEach { a ->
                AssistChip(onClick = {}, label = { Text(a.ageGroup?.label(lang).orEmpty()) }, modifier = Modifier.padding(end = 6.dp))
            }
            r.feedingType?.let {
                AssistChip(onClick = {}, label = { Text(it.label(lang)) })
            }
        }
        Spacer(Modifier.height(10.dp))
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(tr("ingredients", lang), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                if (r.ingredientsDetailed.isNotEmpty()) {
                    r.ingredientsDetailed.forEach { d ->
                        val qty = listOfNotNull(d.quantity?.toString(), d.unit).filter { it.isNotBlank() }.joinToString(" ")
                        Text("• ${d.ingredient?.label(lang).orEmpty()}${if (qty.isNotBlank()) " — $qty" else ""}${if (d.note(lang).isNotBlank()) " (${d.note(lang)})" else ""}")
                    }
                } else {
                    Text(r.ingredients(lang))
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(tr("prep", lang), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                r.stepsList(lang).forEachIndexed { i, s ->
                    Text("${i + 1}. $s", modifier = Modifier.padding(vertical = 2.dp))
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        Text(
            "${tr("vote", lang)}${if (myVote > 0) " ($myVote/5)" else ""}",
            style = MaterialTheme.typography.titleSmall
        )
        StarsRow(value = myVote, onPick = onVote)
        Spacer(Modifier.height(6.dp))
        FavButton(fav = fav, onToggle = onFav, big = false)
        Spacer(Modifier.height(10.dp))
        val banner = Ads.bannerUnit(cfg)
        if (banner.isNotBlank()) {
            BannerSlot(banner)
        }
        Spacer(Modifier.height(16.dp))
    }
}
