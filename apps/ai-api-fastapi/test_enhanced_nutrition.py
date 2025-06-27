#!/usr/bin/env python3
"""
Test script for enhanced nutrition calculation functionality.
This script tests the new features:
1. Database search for existing food items
2. Internet search for new food items
3. Automatic food item creation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from note_routes import (
    search_food_in_database,
    search_nutrition_on_internet,
    calculate_nutrition_from_gpt_for_100g,
    calculate_nutrition_from_gpt
)

def test_database_search():
    """Test database search functionality"""
    print("🔍 Testing database search...")
    
    db = SessionLocal()
    try:
        # Test with existing food (should be in Mockup.sql)
        existing_food = search_food_in_database("현미밥", db)
        if existing_food:
            print(f"✅ Found existing food: {existing_food.name}")
            print(f"   Calories: {existing_food.calories} kcal/100g")
        else:
            print("❌ Expected to find '현미밥' in database")
        
        # Test with non-existing food
        non_existing_food = search_food_in_database("아보카도 토스트", db)
        if non_existing_food:
            print(f"⚠️ Unexpectedly found: {non_existing_food.name}")
        else:
            print("✅ Correctly not found: '아보카도 토스트'")
            
    finally:
        db.close()

def test_internet_search():
    """Test internet search functionality"""
    print("\n🌐 Testing internet search...")
    
    try:
        nutrition = search_nutrition_on_internet("아보카도 토스트")
        print(f"✅ Internet search result:")
        print(f"   Calories: {nutrition.get('calories')} kcal/100g")
        print(f"   Carbs: {nutrition.get('carbs')} g/100g")
        print(f"   Protein: {nutrition.get('protein')} g/100g")
        print(f"   Fat: {nutrition.get('fat')} g/100g")
        print(f"   Source: {nutrition.get('source')}")
    except Exception as e:
        print(f"❌ Internet search failed: {e}")

def test_enhanced_nutrition_calculation():
    """Test enhanced nutrition calculation"""
    print("\n🧮 Testing enhanced nutrition calculation...")
    
    db = SessionLocal()
    try:
        # Test with existing food
        print("Testing with existing food (현미밥):")
        existing_nutrition = calculate_nutrition_from_gpt_for_100g("현미밥", db)
        print(f"   Source: {existing_nutrition.get('source')}")
        print(f"   Food Item ID: {existing_nutrition.get('food_item_id')}")
        
        # Test with new food
        print("\nTesting with new food (퀴노아 샐러드):")
        new_nutrition = calculate_nutrition_from_gpt_for_100g("퀴노아 샐러드", db)
        print(f"   Source: {new_nutrition.get('source')}")
        print(f"   Food Item ID: {new_nutrition.get('food_item_id')}")
        
        # Test consumption calculation
        print("\nTesting consumption calculation (퀴노아 샐러드 200g):")
        consumption_nutrition = calculate_nutrition_from_gpt("퀴노아 샐러드", "200g", db)
        print(f"   Calories: {consumption_nutrition.get('calories')} kcal")
        print(f"   Carbs: {consumption_nutrition.get('carbs')} g")
        print(f"   Protein: {consumption_nutrition.get('protein')} g")
        print(f"   Fat: {consumption_nutrition.get('fat')} g")
        
    finally:
        db.close()

def main():
    """Run all tests"""
    print("🚀 Starting enhanced nutrition calculation tests...\n")
    
    test_database_search()
    test_internet_search()
    test_enhanced_nutrition_calculation()
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main() 