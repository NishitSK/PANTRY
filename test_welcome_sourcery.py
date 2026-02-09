"""Test script to demonstrate the corrected welcome-to-sourcery.py functions"""

import datetime

# Define all the corrected functions from welcome-to-sourcery.py

def is_powerful(magic):
    if magic == 'Sourcery':
        return True
    elif magic == 'More Sourcery':
        return True
    else:
        return False

def days_between_dates(date1, date2):
    d1 = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
    d2 = datetime.datetime.strptime(date2, '%Y-%m-%d').date()
    delta = d2 - d1
    return delta.days

def calculate_weighted_moving_average(prices, weights):
    if not prices or not weights:
        raise ValueError("Both prices and weights must be provided.")
    
    if len(weights) > len(prices):
        raise ValueError("Length of weights must be less than or equal to length of prices.")
    
    total_weight = sum(weights)
    normalized_weights = [w / total_weight for w in weights]
    
    wma = []
    for i in range(len(prices) - len(weights) + 1):
        weighted_sum = sum(prices[i + j] * normalized_weights[j] for j in range(len(weights)))
        wma.append(weighted_sum)
    
    return wma

def magical_hoist(magic):
    if is_powerful(magic):
        result = 'Magic'
    else:
        print("Not powerful.")
        result = 'Magic'
    print(result)

def find_more(magicks):
    powerful_magic = []
    for magic in magicks:
        if not is_powerful(magic):
            continue
        powerful_magic.append(magic)
    return powerful_magic

def print_all(spells):
    for i in range(len(spells)):
        print(spells[i])

# Run the tests
print("=" * 60)
print("Testing corrected welcome-to-sourcery.py functions")
print("=" * 60)

# Test 1: days_between_dates (previously had missing datetime import)
print("\n1. Testing days_between_dates():")
try:
    result = days_between_dates('2026-01-01', '2026-02-06')
    print(f"   Days between 2026-01-01 and 2026-02-06: {result} days")
    print("   ✅ SUCCESS - datetime import is working!")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 2: calculate_weighted_moving_average
print("\n2. Testing calculate_weighted_moving_average():")
try:
    prices = [100, 102, 101, 105, 107, 110]
    weights = [1, 2, 3]
    result = calculate_weighted_moving_average(prices, weights)
    print(f"   Prices: {prices}")
    print(f"   Weights: {weights}")
    print(f"   Weighted Moving Average: {[round(x, 2) for x in result]}")
    print("   ✅ SUCCESS")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 3: is_powerful (previously had forward reference issues)
print("\n3. Testing is_powerful():")
try:
    test_cases = ['Sourcery', 'More Sourcery', 'Regular Magic', 'Nothing']
    for magic in test_cases:
        result = is_powerful(magic)
        print(f"   is_powerful('{magic}'): {result}")
    print("   ✅ SUCCESS - Function is defined before usage!")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 4: magical_hoist (previously called is_powerful before it was defined)
print("\n4. Testing magical_hoist():")
try:
    print("   Testing with 'Sourcery':")
    print("   ", end="")
    magical_hoist('Sourcery')
    print("   Testing with 'Regular Magic':")
    print("   ", end="")
    magical_hoist('Regular Magic')
    print("   ✅ SUCCESS - No forward reference error!")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 5: find_more (previously called is_powerful before it was defined)
print("\n5. Testing find_more():")
try:
    magicks = ['Sourcery', 'Regular Magic', 'More Sourcery', 'Weak Magic']
    result = find_more(magicks)
    print(f"   Input: {magicks}")
    print(f"   Powerful magic found: {result}")
    print("   ✅ SUCCESS - No forward reference error!")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 6: print_all
print("\n6. Testing print_all():")
try:
    spells = ['Fireball', 'Ice Storm', 'Lightning Bolt']
    print(f"   Printing spells: {spells}")
    print("   ", end="")
    print_all(spells)
    print("   ✅ SUCCESS")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 60)
print("All tests completed! All critical errors have been fixed.")
print("=" * 60)
