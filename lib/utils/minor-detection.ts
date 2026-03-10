/**
 * Calculate age from birth date relative to a reference date.
 * Returns null if birthDate is invalid.
 */
export function calculateAge(birthDate: string, referenceDate?: Date): number | null {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    const ref = referenceDate ?? new Date();
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Check if a person is a minor (under 18) at the reference date.
 */
export function isMinor(birthDate: string, referenceDate?: Date): boolean {
    const age = calculateAge(birthDate, referenceDate);
    if (age === null) return false;
    return age < 18;
}
