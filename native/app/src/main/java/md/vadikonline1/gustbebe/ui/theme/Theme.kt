package md.vadikonline1.gustbebe.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable

// Tema M3 custom a fost eliminata la cerere: se foloseste schema implicita
// Material (fara culori proprii). Componentele material3 raman.
@Composable
fun GustBebeTheme(content: @Composable () -> Unit) {
    MaterialTheme(content = content)
}
