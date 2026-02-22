/**
 * Calculate pregnancy probability based on female age
 * @param age - Age of the female partner
 * @returns Probability percentage (0-100)
 */
export const getFemalePregnancyProbability = (age: number): number => {
    if (age >= 18 && age <= 24) {
        return 27.5; // Average of 25-30%
    } else if (age >= 25 && age <= 29) {
        return 22.5; // Average of 20-25%
    } else if (age >= 30 && age <= 34) {
        return 17.5; // Average of 15-20%
    } else if (age >= 35 && age <= 39) {
        return 12.5; // Average of 10-15%
    } else if (age >= 40 && age <= 45) {
        return 5; // 5% or less
    } else {
        return 0; // Outside typical reproductive age
    }
};

/**
 * Calculate pregnancy probability based on male age
 * @param age - Age of the male partner
 * @returns Probability percentage (0-100)
 */
export const getMalePregnancyProbability = (age: number): number => {
    if (age >= 20 && age <= 24) {
        return 27.5; // Average of 25-30%
    } else if (age >= 25 && age <= 29) {
        return 22.5; // Approximate for mid-20s
    } else if (age >= 30 && age <= 39) {
        return 12.5; // Average of 10-15% for late 30s
    } else if (age >= 40) {
        return 2.5; // Less than 5%
    } else {
        return 0; // Too young
    }
};

/**
 * Calculate combined pregnancy probability using the lower of both partners' probabilities
 * @param femaleAge - Age of the female partner
 * @param maleAge - Age of the male partner
 * @returns Combined probability percentage (0-100)
 */
export const getCombinedPregnancyProbability = (femaleAge: number, maleAge: number): number => {
    const femaleProbability = getFemalePregnancyProbability(femaleAge);
    const maleProbability = getMalePregnancyProbability(maleAge);
    // Use the lower probability (biological constraint)
    return Math.min(femaleProbability, maleProbability);
};

/**
 * Check if pregnancy occurs based on probability
 * @param probability - Probability percentage (0-100)
 * @returns true if pregnancy occurs, false otherwise
 */
export const checkPregnancyOccurrence = (probability: number): boolean => {
    const randomChance = Math.random() * 100;
    return randomChance <= probability;
};

/**
 * Calculate gestation period with weighted probability distribution
 * @returns Gestation period in days
 */
export const calculateGestationPeriod = (): number => {
    const random = Math.random() * 100;
    
    if (random < 2) {
        // 2% chance: 132-230
        return Math.floor(Math.random() * (230 - 132 + 1)) + 132;
    } else if (random < 12) {
        // 20% chance: 231-258
        return Math.floor(Math.random() * (258 - 231 + 1)) + 231;
    } else if (random < 88) {
        // 56% chance: 259-285 (most common)
        return Math.floor(Math.random() * (285 - 259 + 1)) + 259;
    } else if (random < 98) {
        // 20% chance: 286-313
        return Math.floor(Math.random() * (313 - 286 + 1)) + 286;
    } else {
        // 2% chance: 314-375
        return Math.floor(Math.random() * (375 - 314 + 1)) + 314;
    }
};
