export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}
export interface UserProfile {
    id: number;
    nickname: string;
    height?: number;
    weight?: number;
}
export interface FoodItem {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}
export interface FoodLogRequest {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    items: FoodItem[];
    loggedAt: string;
}
