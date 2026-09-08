package md.vadikonline1.gustbebe.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

@Composable
fun FavoritesScreen(nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val vm: FavoritesViewModel = appViewModel(::FavoritesViewModel)
    val items by vm.items.collectAsState()
    var confirmId by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(Unit) { vm.load() }

    if (items.isEmpty()) {
        EmptyState(tr("emptyRecipes", lang))
        return
    }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp)) {
        items(items, key = { it.id }) { r ->
            Card(
                onClick = { nav.navigate("detail/${r.id}-${r.slug}") },
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(r.title(lang), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        Text(
                            "⭐ ${"%.1f".format(r.avgRating)} (${r.ratingsCount})",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = { confirmId = r.id }) {
                        Icon(Icons.Rounded.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }

    confirmId?.let { id ->
        ConfirmDialog(
            title = tr("favorites", lang),
            text = tr("confirmDeleteFav", lang),
            onYes = { vm.remove(id); confirmId = null },
            onNo = { confirmId = null }
        )
    }
}
