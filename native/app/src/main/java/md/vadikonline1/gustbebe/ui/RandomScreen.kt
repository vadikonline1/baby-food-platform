package md.vadikonline1.gustbebe.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RandomScreen(nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val vm: RandomViewModel = appViewModel(::RandomViewModel)
    val recipe by vm.recipe.collectAsState()
    val detailVm: DetailViewModel = appViewModel(::DetailViewModel)
    val detail by detailVm.recipe.collectAsState()
    val myVote by detailVm.myVote.collectAsState()
    val fav by detailVm.fav.collectAsState()
    val cfgVm: SettingsViewModel = appViewModel(::SettingsViewModel)
    val cfg by cfgVm.config.collectAsState()

    LaunchedEffect(Unit) {
        vm.load()
        cfgVm.loadConfig()
    }
    LaunchedEffect(recipe?.id) {
        recipe?.let { detailVm.load("${it.id}-${it.slug}") }
    }

    Column(Modifier.fillMaxSize()) {
        // Antet compact (fara al doilea TopAppBar — facea spatiu masiv sub "GustBebe").
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            Text(
                tr("random", lang),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            FilledTonalButton(
                onClick = { vm.load() },
                shape = CircleShape,
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Icon(Icons.Rounded.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(tr("anotherRecipe", lang), style = MaterialTheme.typography.labelLarge)
            }
        }
        if (recipe == null || detail?.id != recipe?.id) {
            LoadingRow()
        } else {
            DetailBody(
                r = detail!!,
                lang = lang,
                myVote = myVote,
                fav = fav,
                cfg = cfg,
                onVote = { detailVm.vote(it) },
                onFav = { detailVm.toggleFav() }
            )
        }
    }
}
