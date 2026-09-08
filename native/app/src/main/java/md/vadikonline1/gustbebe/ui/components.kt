package md.vadikonline1.gustbebe.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.debugInspectorInfo
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil3.compose.SubcomposeAsyncImage
import md.vadikonline1.gustbebe.data.Lang
import md.vadikonline1.gustbebe.data.UiLang
import md.vadikonline1.gustbebe.data.UiTheme
import md.vadikonline1.gustbebe.data.Network
import md.vadikonline1.gustbebe.data.RecipeDto
import md.vadikonline1.gustbebe.data.RemoteConfig
import md.vadikonline1.gustbebe.data.tr

// Ripple implicit + usoara micsorare la apasare (fara bounce).
fun Modifier.pressable(onClick: () -> Unit): Modifier = composed(
    inspectorInfo = debugInspectorInfo { name = "pressable" }
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.96f else 1f, label = "press")
    this
        .scale(scale)
        .clickable(interactionSource = interaction, indication = LocalIndication.current, onClick = onClick)
}

@Composable
fun ImagePlaceholder(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.background(MaterialTheme.colorScheme.primaryContainer),
        contentAlignment = Alignment.Center
    ) {
        Text("🍽️", style = MaterialTheme.typography.headlineLarge)
    }
}

@Composable
fun RecipeImage(url: String?, modifier: Modifier = Modifier) {
    val absolute = Network.absoluteImage(url)
    if (absolute.isNullOrBlank()) {
        ImagePlaceholder(modifier)
    } else {
        SubcomposeAsyncImage(
            model = absolute,
            contentDescription = null,
            modifier = modifier,
            contentScale = ContentScale.Crop,
            loading = { ImagePlaceholder(Modifier.matchParentSize()) },
            error = { ImagePlaceholder(Modifier.matchParentSize()) }
        )
    }
}

@Composable
fun RecipeCard(
    item: RecipeDto,
    lang: String,
    onOpen: () -> Unit,
    modifier: Modifier = Modifier,
    fav: Boolean = item.isFavorite,
    onFav: (() -> Unit)? = null
) {
    val totalMin = item.prepMinutes + item.cookMinutes
    Card(
        onClick = onOpen,
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp, pressedElevation = 4.dp)
    ) {
        Column {
            Box {
                RecipeImage(
                    url = item.imageUrl,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                )
                if (onFav != null) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp)
                            .background(Color.White.copy(alpha = 0.92f), CircleShape)
                            .size(38.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        FavButton(fav = fav, onToggle = onFav)
                    }
                }
            }
            Column(Modifier.padding(12.dp)) {
                Text(
                    item.title(lang),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    minLines = 1
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "⭐ ${"%.1f".format(item.avgRating)} · ${item.ratingsCount} ${tr("votes", lang)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "👁 ${item.viewsCount} ${tr("views", lang)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                    if (totalMin > 0) {
                        Text(
                            " · ⏱ $totalMin ${tr("min", lang)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StarsRow(value: Int, onPick: ((Int) -> Unit)?, starSize: Int = 30) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        (1..5).forEach { v ->
            IconButton(onClick = { onPick?.invoke(v) }, enabled = onPick != null, modifier = Modifier.size((starSize + 14).dp)) {
                Icon(
                    imageVector = Icons.Rounded.Star,
                    contentDescription = "$v",
                    tint = if (v <= value) Color(0xFFF59E0B) else MaterialTheme.colorScheme.outlineVariant,
                    modifier = Modifier.size(starSize.dp)
                )
            }
        }
    }
}

@Composable
fun FavButton(fav: Boolean, onToggle: () -> Unit, big: Boolean = false) {
    IconButton(onClick = onToggle, modifier = Modifier.then(if (big) Modifier.size(56.dp) else Modifier)) {
        Icon(
            imageVector = if (fav) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder,
            contentDescription = null,
            tint = if (fav) Color(0xFFE11D48) else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(if (big) 32.dp else 26.dp)
        )
    }
}

@Composable
fun EmptyState(text: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun LoadingRow() {
    Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) {
        CircularProgressIndicator()
    }
}

@Composable
fun AppTextField(
    value: String,
    onValue: (String) -> Unit,
    label: String,
    password: Boolean = false,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValue,
        label = { Text(label) },
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        modifier = modifier.fillMaxWidth(),
        visualTransformation = if (password) androidx.compose.ui.text.input.PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None
    )
}

@Composable
fun ConfirmDialog(title: String, text: String, onYes: () -> Unit, onNo: () -> Unit) {
    AlertDialog(
        onDismissRequest = onNo,
        shape = RoundedCornerShape(28.dp),
        title = { Text(title) },
        text = { Text(text) },
        confirmButton = { Button(onClick = onYes, shape = RoundedCornerShape(100.dp)) { Text(tr("yes", UiLang.current)) } },
        dismissButton = { TextButton(onClick = onNo) { Text(tr("cancel", UiLang.current)) } }
    )
}

@Composable
fun SupportButtons(cfg: RemoteConfig?, lang: String, telegramFirst: Boolean = false) {
    val context = LocalContext.current
    val supportOn = cfg?.support?.enabled == true
    val tg = cfg?.telegram?.channelUrl.orEmpty()
    if (!supportOn && tg.isBlank()) return
    val title = cfg?.support?.title?.get(lang) ?: cfg?.support?.title?.get("ro").orEmpty()
    val text = cfg?.support?.text?.get(lang) ?: cfg?.support?.text?.get("ro").orEmpty()
    Column(Modifier.fillMaxWidth()) {
        if (title.isNotBlank()) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        if (text.isNotBlank()) {
            Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(8.dp))
        // Butoanele pe un singur rand (inline), ca pe web.
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (supportOn) {
                SupportAdButton(cfg = cfg, modifier = Modifier.weight(1f))
            }
            if (tg.isNotBlank()) {
                OutlinedButton(
                    onClick = {
                        try {
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(tg)))
                        } catch (_: Exception) {
                        }
                    },
                    shape = RoundedCornerShape(100.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("📢 Telegram")
                }
            }
        }
    }
}

@Composable
fun BannerSlot(unitId: String) {
    if (unitId.isBlank()) return
    val context = LocalContext.current
    androidx.compose.ui.viewinterop.AndroidView(
        modifier = Modifier.fillMaxWidth().height(60.dp),
        factory = {
            com.google.android.gms.ads.AdView(it).apply {
                setAdSize(com.google.android.gms.ads.AdSize.BANNER)
                adUnitId = unitId
                loadAd(com.google.android.gms.ads.AdRequest.Builder().build())
            }
        }
    )
}

@Composable
fun ThemeChips(current: String, lang: String, onPick: (String) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        UiTheme.ALL.forEach { mode ->
            val label = when (mode) {
                UiTheme.LIGHT -> tr("themeLight", lang)
                UiTheme.DARK -> tr("themeDark", lang)
                else -> tr("themeSystem", lang)
            }
            val selected = current == mode
            if (selected) {
                Button(onClick = { onPick(mode) }, shape = RoundedCornerShape(100.dp)) {
                    Text(label)
                }
            } else {
                OutlinedButton(onClick = { onPick(mode) }, shape = RoundedCornerShape(100.dp)) {
                    Text(label)
                }
            }
        }
    }
}

@Composable
fun LangChips(current: String, onPick: (String) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Lang.ALL.forEach { code ->
            val selected = current == code
            if (selected) {
                Button(onClick = { onPick(code) }, shape = RoundedCornerShape(100.dp)) {
                    Text(Lang.label(code))
                }
            } else {
                OutlinedButton(onClick = { onPick(code) }, shape = RoundedCornerShape(100.dp)) {
                    Text(Lang.label(code))
                }
            }
        }
    }
}
