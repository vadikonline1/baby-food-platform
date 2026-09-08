package md.vadikonline1.gustbebe.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Shuffle
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.foundation.layout.RowScope
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

private val TABS = listOf("home", "categories", "guide")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppRoot() {
    val nav = rememberNavController()
    val lang by UiLang.flow.collectAsState()
    var tab by mutableIntStateOf(0)
    var showMore by remember { mutableStateOf(false) }
    var showAbout by remember { mutableStateOf(false) }

    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route ?: "home"
    // Detaliul/categoria apartin de "acasa" in meniul de jos.
    val footerRoute = when (route) {
        "random" -> "random"
        "favorites" -> "favorites"
        else -> "home"
    }

    fun go(dest: String) {
        nav.navigate(dest) {
            popUpTo("home") { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "GustBebe",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                },
                actions = {
                    // Cele 3 puncte verticale: profil, setari, despre.
                    Box {
                        IconButton(onClick = { showMore = true }) {
                            Icon(Icons.Rounded.MoreVert, contentDescription = null)
                        }
                        DropdownMenu(expanded = showMore, onDismissRequest = { showMore = false }) {
                            DropdownMenuItem(
                                text = { Text("Profil / Auth") },
                                leadingIcon = { Icon(Icons.Rounded.Person, contentDescription = null) },
                                onClick = { showMore = false; go("auth") }
                            )
                            DropdownMenuItem(
                                text = { Text(tr("settings", lang)) },
                                leadingIcon = { Icon(Icons.Rounded.Settings, contentDescription = null) },
                                onClick = { showMore = false; go("settings") }
                            )
                            DropdownMenuItem(
                                text = { Text(tr("about", lang)) },
                                leadingIcon = { Icon(Icons.Rounded.Info, contentDescription = null) },
                                onClick = { showMore = false; showAbout = true }
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars)
            )
        },
        // Meniul principal in footer.
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceContainer) {
                FooterItem(
                    icon = Icons.Rounded.Home,
                    label = tr("home", lang),
                    selected = footerRoute == "home",
                    onClick = { go("home") }
                )
                FooterItem(
                    icon = Icons.Rounded.Shuffle,
                    label = tr("random", lang),
                    selected = footerRoute == "random",
                    onClick = { go("random") }
                )
                FooterItem(
                    icon = Icons.Rounded.Favorite,
                    label = tr("favorites", lang),
                    selected = footerRoute == "favorites",
                    onClick = { go("favorites") }
                )
            }
        }
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = "home",
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            composable("home") {
                HomeWithTabs(tab = tab, onTab = { tab = it }, nav = nav)
            }
            composable("detail/{slug}") { back ->
                DetailScreen(slug = back.arguments?.getString("slug").orEmpty(), nav = nav)
            }
            composable("category/{slug}") { back ->
                FilteredListScreen(slug = back.arguments?.getString("slug").orEmpty(), nav = nav)
            }
            composable("random") { RandomScreen(nav = nav) }
            composable("favorites") { FavoritesScreen(nav = nav) }
            composable("settings") { SettingsScreen(nav = nav) }
            composable("auth") { AuthScreen(nav = nav) }
        }
    }

    if (showAbout) {
        AlertDialog(
            onDismissRequest = { showAbout = false },
            title = { Text(tr("about", lang)) },
            text = { Text(tr("aboutText", lang)) },
            confirmButton = { TextButton(onClick = { showAbout = false }) { Text("OK") } }
        )
    }
}

@Composable
private fun RowScope.FooterItem(icon: ImageVector, label: String, selected: Boolean, onClick: () -> Unit) {
    NavigationBarItem(
        selected = selected,
        onClick = onClick,
        icon = { Icon(icon, contentDescription = null) },
        label = { Text(label, style = MaterialTheme.typography.labelMedium) },
        colors = NavigationBarItemDefaults.colors(
            selectedIconColor = MaterialTheme.colorScheme.onPrimaryContainer,
            selectedTextColor = MaterialTheme.colorScheme.primary,
            indicatorColor = MaterialTheme.colorScheme.primaryContainer
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeWithTabs(tab: Int, onTab: (Int) -> Unit, nav: androidx.navigation.NavController) {
    val lang by UiLang.flow.collectAsState()
    Column(Modifier.fillMaxSize()) {
        androidx.compose.material3.PrimaryTabRow(
            selectedTabIndex = tab,
            containerColor = MaterialTheme.colorScheme.surface,
            divider = {
                androidx.compose.material3.HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }
        ) {
            TABS.forEachIndexed { i, key ->
                androidx.compose.material3.Tab(
                    selected = tab == i,
                    onClick = { onTab(i) },
                    text = { Text(tr(key, lang), style = MaterialTheme.typography.titleSmall) }
                )
            }
        }
        when (tab) {
            0 -> HomeTab(nav = nav)
            1 -> CategoriesTab(nav = nav)
            else -> GuideTab()
        }
    }
}
