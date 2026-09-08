package md.vadikonline1.gustbebe.ui.theme

import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.MotionScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Schema de culori M3 light — roluri exacte din specificatie (light mode only).
val Primary = Color(0xFF6750A4)
val OnPrimary = Color(0xFFFFFFFF)
val PrimaryContainer = Color(0xFFEADDFF)
val OnPrimaryContainer = Color(0xFF21005D)
val Secondary = Color(0xFF635A75)
val SecondaryContainer = Color(0xFFE8DEF8)
val OnSecondaryContainer = Color(0xFF1D192B)
val TertiaryContainer = Color(0xFFFFD8E4)
val OnTertiaryContainer = Color(0xFF31111D)
val Surface = Color(0xFFFEF7FF)
val SurfaceContainerLow = Color(0xFFF7F2FA)
val SurfaceContainer = Color(0xFFF3EDF7)
val SurfaceContainerHigh = Color(0xFFECE6F0)
val SurfaceContainerHighest = Color(0xFFE6E0E9)
val OnSurface = Color(0xFF1D1B20)
val OnSurfaceVariant = Color(0xFF49454F)
val Outline = Color(0xFF79747E)
val OutlineVariant = Color(0xFFCAC4D0)
val InverseSurface = Color(0xFF322F35)
val InverseOnSurface = Color(0xFFF5EFF7)
val InversePrimary = Color(0xFFD0BCFF)
val Error = Color(0xFFB3261E)
val OnError = Color(0xFFFFFFFF)
val ErrorContainer = Color(0xFFF9DEDC)
val OnErrorContainer = Color(0xFF410E0B)

private val LightScheme = lightColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = OnPrimaryContainer,
    secondary = Secondary,
    secondaryContainer = SecondaryContainer,
    onSecondaryContainer = OnSecondaryContainer,
    tertiaryContainer = TertiaryContainer,
    onTertiaryContainer = OnTertiaryContainer,
    surface = Surface,
    surfaceContainerLow = SurfaceContainerLow,
    surfaceContainer = SurfaceContainer,
    surfaceContainerHigh = SurfaceContainerHigh,
    surfaceContainerHighest = SurfaceContainerHighest,
    onSurface = OnSurface,
    onSurfaceVariant = OnSurfaceVariant,
    outline = Outline,
    outlineVariant = OutlineVariant,
    inverseSurface = InverseSurface,
    inverseOnSurface = InverseOnSurface,
    inversePrimary = InversePrimary,
    error = Error,
    onError = OnError,
    errorContainer = ErrorContainer,
    onErrorContainer = OnErrorContainer
)

@Composable
fun GustBebeTheme(content: @Composable () -> Unit) {
    MaterialExpressiveTheme(
        colorScheme = LightScheme,
        motionScheme = MotionScheme.standard(),
        content = content
    )
}
