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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import md.vadikonline1.gustbebe.BuildConfig
import md.vadikonline1.gustbebe.data.Lang
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

@Composable
fun SettingsScreen(nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val context = LocalContext.current
    val vm: SettingsViewModel = appViewModel(::SettingsViewModel)
    val cfg by vm.config.collectAsState()
    val authVm: AuthViewModel = appViewModel(::AuthViewModel)
    val user by authVm.user.collectAsState()

    LaunchedEffect(Unit) {
        vm.loadConfig()
        authVm.init(context)
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(tr("language", lang), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        LangChips(current = lang) { vm.setLang(context, it) }
        Spacer(Modifier.height(16.dp))

        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(Modifier.padding(18.dp)) {
                SupportButtons(cfg = cfg, lang = lang)
            }
        }
        Spacer(Modifier.height(16.dp))

        if (user != null) {
            Button(
                onClick = { nav.navigate("favorites") },
                shape = RoundedCornerShape(100.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(tr("myFavorites", lang))
            }
            Spacer(Modifier.height(8.dp))
        }
        Row {
            Text(
                "GustBebe v${BuildConfig.VERSION_NAME}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
