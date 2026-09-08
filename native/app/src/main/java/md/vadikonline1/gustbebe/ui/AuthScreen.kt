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
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.tr

@Composable
fun AuthScreen(nav: NavController) {
    val lang by UiLang.flow.collectAsState()
    val context = LocalContext.current
    val vm: AuthViewModel = appViewModel(::AuthViewModel)
    val user by vm.user.collectAsState()
    var mode by remember { mutableIntStateOf(0) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var pendingVerify by remember { mutableStateOf(false) }
    var cur by remember { mutableStateOf("") }
    var npw by remember { mutableStateOf("") }
    var msg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { vm.init(context) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        if (user == null) {
            Row {
                TextButton(onClick = { mode = 0 }) {
                    Text(
                        tr("login", lang),
                        fontWeight = if (mode == 0) FontWeight.Bold else FontWeight.Normal,
                        color = if (mode == 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                TextButton(onClick = { mode = 1 }) {
                    Text(
                        tr("register", lang),
                        fontWeight = if (mode == 1) FontWeight.Bold else FontWeight.Normal,
                        color = if (mode == 1) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(Modifier.padding(18.dp)) {
                    if (mode == 1) {
                        AppTextField(value = name, onValue = { name = it }, label = tr("name", lang))
                        Spacer(Modifier.height(8.dp))
                    }
                    AppTextField(value = email, onValue = { email = it }, label = tr("email", lang))
                    Spacer(Modifier.height(8.dp))
                    AppTextField(value = password, onValue = { password = it }, label = tr("password", lang), password = true)
                    Spacer(Modifier.height(12.dp))
                    if (mode == 0) {
                        Button(
                            onClick = {
                                error = null
                                vm.login(email.trim(), password) { code ->
                                    error = if (code == "unverified") tr("needVerify", lang) else tr("invalidLogin", lang)
                                }
                            },
                            shape = RoundedCornerShape(100.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) { Text(tr("doLogin", lang)) }
                    } else {
                        Button(
                            onClick = {
                                error = null
                                vm.register(name.trim(), email.trim(), password) { ok ->
                                    pendingVerify = !ok
                                    if (!ok && error == null) error = null
                                }
                            },
                            shape = RoundedCornerShape(100.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) { Text(tr("doRegister", lang)) }
                    }
                    if (pendingVerify) {
                        Spacer(Modifier.height(8.dp))
                        Text(tr("needVerify", lang), color = MaterialTheme.colorScheme.primary)
                    }
                    error?.let {
                        Spacer(Modifier.height(8.dp))
                        Text(it, color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        } else {
            val u = user ?: return
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Text(u.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text(u.email, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(12.dp))
                    AppTextField(value = name, onValue = { name = it }, label = tr("saveName", lang))
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = {
                            if (name.isBlank()) return@Button
                            vm.saveName(name.trim(), onOk = { msg = tr("savedOk", lang); name = "" }, onErr = { msg = tr("invalidLogin", lang) })
                        },
                        shape = RoundedCornerShape(100.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) { Text(tr("saveName", lang)) }
                    Spacer(Modifier.height(8.dp))
                    AppTextField(value = cur, onValue = { cur = it }, label = tr("currentPassword", lang), password = true)
                    Spacer(Modifier.height(8.dp))
                    AppTextField(value = npw, onValue = { npw = it }, label = tr("newPassword", lang), password = true)
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = {
                            if (npw.length < 6) {
                                msg = tr("newPassword", lang) + " (min 6)"
                                return@Button
                            }
                            vm.savePassword(cur, npw, onOk = { msg = tr("savedOk", lang); cur = ""; npw = "" }, onErr = { msg = tr("invalidLogin", lang) })
                        },
                        shape = RoundedCornerShape(100.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) { Text(tr("changePassword", lang)) }
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = { vm.logout(context); nav.navigate("home") },
                        shape = RoundedCornerShape(100.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) { Text(tr("logout", lang)) }
                    msg?.let {
                        Spacer(Modifier.height(8.dp))
                        Text(it, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}
