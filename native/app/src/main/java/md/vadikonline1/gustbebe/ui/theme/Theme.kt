package md.vadikonline1.gustbebe.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Paleta GustBebe din web UI: albastru bebelus #1486B7 + verde brad #065F46.
private val BabyBlue = Color(0xFF1486B7)
private val BabyBlueDark = Color(0xFF0D6488)
private val BabyBlueSoft = Color(0xFFE8F3F9)
private val Pine = Color(0xFF065F46)
private val PineSoft = Color(0xFFE6F2EC)
private val Amber = Color(0xFFB45309)
private val AmberSoft = Color(0xFFFEF3E2)
private val Ink = Color(0xFF1E2F2B)
private val Muted = Color(0xFF5F7A70)
private val Line = Color(0xFFF0F4F1)
private val LineStrong = Color(0xFFCFDFEE)
private val Bg = Color(0xFFFBF9F7)
private val Danger = Color(0xFFB91C1C)
private val Heart = Color(0xFFE11D48)
private val Star = Color(0xFFF59E0B)

val GustHeart: Color get() = Heart
val GustStar: Color get() = Star

private val LightScheme = lightColorScheme(
    primary = BabyBlue,
    onPrimary = Color.White,
    primaryContainer = BabyBlueSoft,
    onPrimaryContainer = BabyBlueDark,
    secondary = Pine,
    onSecondary = Color.White,
    secondaryContainer = PineSoft,
    onSecondaryContainer = Pine,
    tertiary = Amber,
    onTertiary = Color.White,
    tertiaryContainer = AmberSoft,
    onTertiaryContainer = Amber,
    error = Danger,
    background = Bg,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    surfaceVariant = Line,
    onSurfaceVariant = Muted,
    surfaceContainerLowest = Color.White,
    surfaceContainerLow = Color.White,
    surfaceContainer = Line,
    surfaceContainerHigh = BabyBlueSoft,
    outline = Muted,
    outlineVariant = LineStrong
)

private val DarkScheme = darkColorScheme(
    primary = Color(0xFF7FC9E8),
    onPrimary = Color(0xFF06303F),
    primaryContainer = BabyBlueDark,
    onPrimaryContainer = BabyBlueSoft,
    secondary = Color(0xFF7BC8A4),
    onSecondary = Color(0xFF06382A),
    secondaryContainer = Pine,
    onSecondaryContainer = PineSoft,
    tertiary = Color(0xFFF0B35C),
    tertiaryContainer = Color(0xFF4A2C05),
    onTertiaryContainer = Color(0xFFFDE7C8),
    error = Color(0xFFF2A3A3),
    background = Color(0xFF101915),
    onBackground = Color(0xFFE9F0EB),
    surface = Color(0xFF16211C),
    onSurface = Color(0xFFE9F0EB),
    surfaceVariant = Color(0xFF223029),
    onSurfaceVariant = Color(0xFF9DB3A7),
    surfaceContainerLowest = Color(0xFF0C130F),
    surfaceContainerLow = Color(0xFF16211C),
    surfaceContainer = Color(0xFF1C2822),
    surfaceContainerHigh = Color(0xFF24352C),
    outline = Color(0xFF7E968B),
    outlineVariant = Color(0xFF2E4038)
)

@Composable
fun GustBebeTheme(dark: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (dark) DarkScheme else LightScheme, content = content)
}
