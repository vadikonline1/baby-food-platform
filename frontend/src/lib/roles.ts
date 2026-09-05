// Afisare roluri: MODERATOR se prezinta ca "Autor" (backend pastreaza valorile stabile pentru API mobil)
export function roleLabel(role: string): string {
  if (role === 'MODERATOR') return 'Autor';
  if (role === 'ADMIN') return 'Administrator';
  return 'Utilizator';
}
