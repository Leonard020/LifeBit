# Enhanced Nutrition Calculation System

## Overview

The enhanced nutrition calculation system has been implemented to provide intelligent food nutrition analysis and automatic database management. When users input food consumption information, the system now:

1. **Analyzes user input** using GPT AI
2. **Searches the database** for existing food items
3. **Searches the internet** for new food items if not found in database
4. **Automatically creates** new food items with nutrition information
5. **Calculates consumption amounts** based on the food_item database

## Key Features

### 🔍 Smart Database Search
- **Exact matching**: Finds foods with exact name matches
- **Partial matching**: Finds foods containing the search term
- **Reverse matching**: Finds foods where the search term is contained in the food name
- **Best match selection**: Chooses the most similar food item

### 🌐 Internet Search Integration
- **GPT-powered nutrition lookup**: Uses GPT to search for nutrition information online
- **Automatic food item creation**: Creates new food items in the database
- **Reliable nutrition data**: Provides accurate 100g-based nutrition information

### 🧮 Intelligent Calculation
- **Amount conversion**: Converts user input (e.g., "2개", "1공기") to grams
- **Proportional calculation**: Calculates nutrition based on actual consumption amount
- **Database integration**: Uses existing or newly created food items

## Implementation Details

### Core Functions

#### `search_food_in_database(food_name: str, db: Session)`
Searches the database for existing food items using multiple matching strategies.

#### `search_nutrition_on_internet(food_name: str)`
Uses GPT to search for nutrition information online and returns structured data.

#### `calculate_nutrition_from_gpt_for_100g(food_name: str, db: Session)`
Main function that:
1. Searches database first
2. Falls back to internet search if not found
3. Creates new food item if needed
4. Returns nutrition data with source information

#### `calculate_nutrition_from_gpt(food_name: str, amount: str, db: Session)`
Calculates nutrition for specific consumption amounts based on 100g data.

### Database Integration

The system integrates with the existing `food_items` table:

```sql
CREATE TABLE food_items (
    food_item_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    food_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    serving_size DECIMAL(6,2),
    calories DECIMAL(6,2),
    carbs DECIMAL(6,2),
    protein DECIMAL(6,2),
    fat DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Enhanced Diet Record Saving
- **Endpoint**: `POST /api/py/note/diet`
- **Functionality**: Automatically handles food item creation and nutrition calculation
- **Response**: Includes nutrition source information

#### Food Item Creation
- **Endpoint**: `POST /api/py/food-items/create-from-gpt`
- **Functionality**: Creates new food items with GPT-generated nutrition data
- **Response**: Returns food item ID and nutrition information

## Usage Examples

### Frontend Integration

The enhanced system works seamlessly with the existing frontend:

1. **User inputs**: "아침에 아보카도 토스트 2개 먹었어요"
2. **GPT analysis**: Extracts food name, amount, and meal time
3. **Database search**: Looks for "아보카도 토스트" in database
4. **Internet search**: If not found, searches online for nutrition data
5. **Food item creation**: Creates new food item with nutrition information
6. **Amount calculation**: Converts "2개" to grams and calculates nutrition
7. **Database storage**: Saves meal log with calculated nutrition

### API Response Example

```json
{
  "message": "식단 기록 저장 성공",
  "meal_log_id": 123,
  "food_item_id": 456,
  "user_id": 1,
  "quantity": 160.0,
  "log_date": "2024-01-15",
  "meal_time": "breakfast",
  "nutrition_source": "internet_created",
  "debug": {
    "food_item_search": "Found: false",
    "food_item_created": 456,
    "final_food_item_id": 456
  }
}
```

## Testing

Run the test script to verify functionality:

```bash
cd apps/ai-api-fastapi
python test_enhanced_nutrition.py
```

The test script verifies:
- Database search functionality
- Internet search functionality
- Enhanced nutrition calculation
- Food item creation

## Configuration

### Environment Variables

Ensure the following environment variables are set:

```bash
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_connection_string
```

### Database Setup

The system requires the `food_items` table to be created. Use the provided SQL schema in `LifeBit.sql` or `Mockup.sql`.

## Error Handling

The system includes comprehensive error handling:

- **Database errors**: Graceful fallback to internet search
- **GPT API errors**: Fallback to default nutrition values
- **Network errors**: Retry mechanisms and error logging
- **Invalid data**: Validation and sanitization

## Performance Considerations

- **Caching**: Database searches are cached for performance
- **Batch processing**: Multiple foods can be processed in a single request
- **Async operations**: Non-blocking API calls where possible
- **Connection pooling**: Efficient database connection management

## Future Enhancements

Potential improvements:
- **Nutrition database APIs**: Integration with external nutrition databases
- **Image recognition**: Food identification from photos
- **Barcode scanning**: Product lookup via barcodes
- **Machine learning**: Improved nutrition estimation accuracy
- **User feedback**: Nutrition data validation and correction

## Troubleshooting

### Common Issues

1. **GPT API errors**: Check OpenAI API key and quota
2. **Database connection**: Verify database URL and credentials
3. **Nutrition accuracy**: Review GPT prompts for better results
4. **Performance**: Monitor database query performance

### Debug Information

The system provides detailed debug information in API responses and logs:

```python
print(f"[NUTRITION CALC] 시작: {food_name}")
print(f"[DB SEARCH] 정확한 매칭 발견: {food_name}")
print(f"[INTERNET SEARCH] 영양정보 생성 완료: {nutrition_data}")
print(f"[NUTRITION CALC] 새로운 음식 생성 완료: {food_item_id}")
```

## Support

For issues or questions about the enhanced nutrition calculation system, please refer to the main project documentation or create an issue in the project repository. 