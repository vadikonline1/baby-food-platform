package md.vadikonline1.gustbebe.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import md.vadikonline1.gustbebe.data.Lang
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

@Composable
fun HomeTab(nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val vm: RecipesViewModel = appViewModel(::RecipesViewModel)
    val items by vm.items.collectAsState()
    val total by vm.total.collectAsState()
    val loading by vm.loading.collectAsState()
    var q by remember { mutableStateOf("") }
    var showFilters by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { vm.load() }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = q,
                onValueChange = {
                    q = it
                    vm.query = it
                    vm.load()
                },
                placeholder = { Text(tr("searchHint", lang)) },
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                trailingIcon = {
                    if (q.isNotEmpty()) {
                        IconButton(onClick = { q = ""; vm.query = ""; vm.load() }) {
                            Icon(Icons.Rounded.Close, contentDescription = null)
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(100.dp),
                modifier = Modifier.weight(1f)
            )
            androidx.compose.material3.AssistChip(
                onClick = { showFilters = true },
                label = { Text(tr("filters", lang)) },
                trailingIcon = if (!vm.filters.isEmpty()) {
                    { Text("${vm.filters.count()}", style = MaterialTheme.typography.labelMedium) }
                } else null
            )
        }
        if (!vm.filters.isEmpty()) {
            ActiveChips(vm = vm)
        }
        if (loading && items.isEmpty()) {
            LoadingRow()
        } else if (items.isEmpty()) {
            EmptyState(tr("emptyRecipes", lang))
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.padding(horizontal = 8.dp)
            ) {
                items(items, key = { it.id }) { r ->
                    RecipeCard(item = r, lang = lang, onOpen = { nav.navigate("detail/${r.id}-${r.slug}") })
                }
            }
        }
    }

    if (showFilters) {
        FilterSheet(vm = vm, onClose = { showFilters = false })
    }
}

@Composable
private fun ActiveChips(vm: RecipesViewModel) {
    val lang by UiLang.flow.collectAsState()
    val taxVm: TaxViewModel = appViewModel(::TaxViewModel)
    val ages by taxVm.ages.collectAsState()
    val feeds by taxVm.feedings.collectAsState()
    val cats by taxVm.cats.collectAsState()
    val restrs by taxVm.restrs.collectAsState()
    androidx.compose.runtime.LaunchedEffect(Unit) { taxVm.load() }

    fun labelFor(kind: String, v: Any): String {
        return when (kind) {
            "age" -> ages.firstOrNull { it.id == v }?.label(lang) ?: "$v"
            "feeding" -> feeds.firstOrNull { it.id == v }?.label(lang) ?: "$v"
            "category" -> cats.firstOrNull { it.slug == v }?.label(lang) ?: "$v"
            else -> restrs.firstOrNull { it.slug == v }?.label(lang) ?: "$v"
        }
    }

    val chips = buildList {
        vm.filters.ages.forEach { add(Triple("ages", it, labelFor("age", it))) }
        vm.filters.feedings.forEach { add(Triple("feedings", it, labelFor("feeding", it))) }
        vm.filters.categories.forEach { add(Triple("categories", it, labelFor("category", it))) }
        vm.filters.restrictions.forEach { add(Triple("restrictions", it, labelFor("restriction", it))) }
    }
    if (chips.isEmpty()) return
    androidx.compose.foundation.lazy.LazyRow(
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text(
                tr("filterActive", lang) + ":",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.align(Alignment.CenterVertically)
            )
        }
        items(chips) { (kind, v, label) ->
            FilterChip(
                selected = true,
                onClick = {
                    vm.filters = when (kind) {
                        "ages" -> vm.filters.copy(ages = vm.filters.ages - (v as Int))
                        "feedings" -> vm.filters.copy(feedings = vm.filters.feedings - (v as Int))
                        "categories" -> vm.filters.copy(categories = vm.filters.categories - (v as String))
                        else -> vm.filters.copy(restrictions = vm.filters.restrictions - (v as String))
                    }
                    vm.load()
                },
                label = { Text(label) },
                trailingIcon = { Icon(Icons.Rounded.Close, contentDescription = null) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterSheet(vm: RecipesViewModel, onClose: () -> Unit) {
    val lang by UiLang.flow.collectAsState()
    val taxVm: TaxViewModel = appViewModel(::TaxViewModel)
    val ages by taxVm.ages.collectAsState()
    val feeds by taxVm.feedings.collectAsState()
    val cats by taxVm.cats.collectAsState()
    val restrs by taxVm.restrs.collectAsState()
    var draft by remember(vm.filters) { mutableStateOf(vm.filters) }

    androidx.compose.runtime.LaunchedEffect(Unit) { taxVm.load() }

    ModalBottomSheet(onDismissRequest = onClose) {
        Column(Modifier.padding(horizontal = 16.dp)) {
            Text(tr("filters", lang), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            androidx.compose.foundation.lazy.LazyColumn(modifier = Modifier.weight(1f, fill = false)) {
                item {
                    FilterGroup(
                        title = tr("age", lang),
                        options = ages.map { it.id to it.label(lang) },
                        selected = draft.ages.map { it as Any }.toSet(),
                        onToggle = { v ->
                            val id = v as Int
                            draft = draft.copy(ages = if (id in draft.ages) draft.ages - id else draft.ages + id)
                        }
                    )
                    FilterGroup(
                        title = tr("feeding", lang),
                        options = feeds.map { it.id to it.label(lang) },
                        selected = draft.feedings.map { it as Any }.toSet(),
                        onToggle = { v ->
                            val id = v as Int
                            draft = draft.copy(feedings = if (id in draft.feedings) draft.feedings - id else draft.feedings + id)
                        }
                    )
                    FilterGroup(
                        title = tr("categories", lang),
                        options = cats.map { (it.slug ?: "") to it.label(lang) },
                        selected = draft.categories.map { it as Any }.toSet(),
                        onToggle = { v ->
                            val s = v as String
                            draft = draft.copy(categories = if (s in draft.categories) draft.categories - s else draft.categories + s)
                        }
                    )
                    FilterGroup(
                        title = tr("restrictions", lang),
                        options = restrs.map { (it.slug ?: "") to it.label(lang) },
                        selected = draft.restrictions.map { it as Any }.toSet(),
                        onToggle = { v ->
                            val s = v as String
                            draft = draft.copy(restrictions = if (s in draft.restrictions) draft.restrictions - s else draft.restrictions + s)
                        }
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { vm.filters = draft; vm.load(); onClose() },
                            shape = RoundedCornerShape(100.dp),
                            modifier = Modifier.weight(1f)
                        ) { Text(tr("apply", lang)) }
                        androidx.compose.material3.OutlinedButton(
                            onClick = {
                                vm.filters = RecipeFilters()
                                draft = RecipeFilters()
                                vm.load()
                                onClose()
                            },
                            shape = RoundedCornerShape(100.dp),
                            modifier = Modifier.weight(1f)
                        ) { Text(tr("reset", lang)) }
                    }
                    Spacer(Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
private fun FilterGroup(
    title: String,
    options: List<Pair<Any, String>>,
    selected: Set<Any>,
    onToggle: (Any) -> Unit
) {
    Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 6.dp))
    options.forEach { (v, label) ->
        FilterChip(
            selected = v in selected,
            onClick = { onToggle(v) },
            label = { Text(label) },
            modifier = Modifier.padding(vertical = 2.dp)
        )
    }
}

@Composable
fun CategoriesTab(nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val vm: TaxViewModel = appViewModel(::TaxViewModel)
    val cats by vm.cats.collectAsState()
    androidx.compose.runtime.LaunchedEffect(Unit) { vm.load(withCounts = true) }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp)) {
        items(cats, key = { it.id }) { c ->
            Card(
                onClick = { nav.navigate("category/${c.slug ?: ""}") },                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
            ) {
                Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(c.icon ?: "🍽️", style = MaterialTheme.typography.headlineMedium)
                    Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                        Text(c.label(lang), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            "${c.count?.recipes ?: 0} ${tr("recipes", lang)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun FilteredListScreen(slug: String, nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val vm: RecipesViewModel = appViewModel(::RecipesViewModel)
    val items by vm.items.collectAsState()
    androidx.compose.runtime.LaunchedEffect(slug) {
        vm.filters = RecipeFilters(categories = setOf(slug))
        vm.load()
    }
    Column(Modifier.fillMaxSize()) {
        Text(
            slug,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        if (items.isEmpty()) {
            EmptyState(tr("emptyRecipes", lang))
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.padding(horizontal = 8.dp)
            ) {
                items(items, key = { it.id }) { r ->
                    RecipeCard(item = r, lang = lang, onOpen = { nav.navigate("detail/${r.id}-${r.slug}") })
                }
            }
        }
    }
}

@Composable
fun GuideTab() {
    val lang by UiLang.flow.collectAsState()
    val vm: GuideViewModel = appViewModel(::GuideViewModel)
    val items by vm.items.collectAsState()
    androidx.compose.runtime.LaunchedEffect(Unit) { vm.load() }
    if (items.isEmpty()) {
        EmptyState(tr("loading", lang))
    } else {
        LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp)) {
            items(items, key = { it.id }) { g ->
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp)
                ) {
                    Column(Modifier.padding(18.dp)) {
                        Text(g.icon, style = MaterialTheme.typography.headlineMedium)
                        Spacer(Modifier.height(6.dp))
                        Text(g.title(lang), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                        Text(g.body(lang), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}
