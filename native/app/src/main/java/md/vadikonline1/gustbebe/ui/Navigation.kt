package md.vadikonline1.gustbebe.ui

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Shuffle
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.launch
import md.vadikonline1.gustbebe.data.Lang
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

private val TABS = listOf("home", "categories", "guide")
private val TAB_ICONS = mapOf(
    "home" to Icons.Rounded.Home,
    "categories" to Icons.Rounded.Menu,
    "guide" to Icons.Rounded.Info
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppRoot() {
    val nav = rememberNavController()
    val drawer = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val lang by UiLang.flow.collectAsState()
    var tab by mutableIntStateOf(0)
    var showMore by remember { mutableStateOf(false) }
    var showAbout by remember { mutableStateOf(false) }

    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route ?: "home"

    ModalNavigationDrawer(
        drawerState = drawer,
        drawerContent = {
            ModalDrawerSheet {
                Text(
                    "GustBebe",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(20.dp)
                )
                DrawerEntry(Icons.Rounded.Person, "Profil / Auth") {
                    scope.launch { drawer.close() }
                    nav.navigate("auth")
                }
                DrawerEntry(Icons.Rounded.Favorite, tr("favorites", lang)) {
                    scope.launch { drawer.close() }
                    nav.navigate("favorites")
                }
                DrawerEntry(Icons.Rounded.Settings, tr("settings", lang)) {
                    scope.launch { drawer.close() }
                    nav.navigate("settings")
                }
                DrawerEntry(Icons.Rounded.Info, tr("about", lang)) {
                    scope.launch { drawer.close() }
                    showAbout = true
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("GustBebe", style = MaterialTheme.typography.titleLarge) },
                    navigationIcon = {
                        IconButton(
                            onClick = { scope.launch { drawer.open() } },
                            modifier = Modifier.padding(start = 4.dp)
                        ) {
                            Icon(Icons.Rounded.Menu, contentDescription = null, modifier = Modifier.padding(12.dp))
                        }
                    },
                    actions = {
                        IconButton(onClick = { showMore = true }, modifier = Modifier.padding(end = 4.dp)) {
                            Icon(Icons.Rounded.MoreVert, contentDescription = null, modifier = Modifier.padding(12.dp))
                        }
                        DropdownMenu(expanded = showMore, onDismissRequest = { showMore = false }) {
                            DropdownMenuItem(
                                text = { Text(tr("settings", lang)) },
                                onClick = { showMore = false; nav.navigate("settings") }
                            )
                            DropdownMenuItem(
                                text = { Text(tr("about", lang)) },
                                onClick = { showMore = false; showAbout = true }
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars)
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surfaceContainer,
                    tonalElevation = 0.dp,
                    modifier = Modifier
                        .height(80.dp)
                        .windowInsetsPadding(WindowInsets.navigationBars.only(WindowInsetsSides.Bottom))
                ) {
                    BarItem(Icons.Rounded.Home, tr("home", lang), route == "home") { nav.navigate("home") }
                    BarItem(Icons.Rounded.Shuffle, tr("random", lang), route == "random") { nav.navigate("random") }
                    BarItem(Icons.Rounded.Favorite, tr("favorites", lang), route == "favorites") { nav.navigate("favorites") }
                    BarItem(Icons.Rounded.Settings, tr("settings", lang), route == "settings") { nav.navigate("settings") }
                }
            }
        ) { padding ->
            NavHost(
                navController = nav,
                startDestination = "home",
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
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
private fun BarItem(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, selected: Boolean, onClick: () -> Unit) {
    androidx.compose.material3.NavigationBarItem(
        selected = selected,
        onClick = onClick,
        icon = { Icon(icon, contentDescription = null) },
        label = { Text(label, style = MaterialTheme.typography.labelMedium) }
    )
}

@Composable
private fun DrawerEntry(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    NavigationDrawerItem(
        icon = { Icon(icon, contentDescription = null) },
        label = { Text(label) },
        selected = false,
        onClick = onClick,
        modifier = Modifier.padding(horizontal = 12.dp)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeWithTabs(tab: Int, onTab: (Int) -> Unit, nav: androidx.navigation.NavController) {
    val lang by UiLang.flow.collectAsState()
    androidx.compose.foundation.layout.Column(Modifier.fillMaxSize()) {
        PrimaryTabRow(
            selectedTabIndex = tab,
            containerColor = MaterialTheme.colorScheme.surface,
            divider = {
                androidx.compose.material3.HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }
        ) {
            TABS.forEachIndexed { i, key ->
                Tab(
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
