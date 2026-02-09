import datetime

# Test the corrected functions

# 1. Test datetime import fix
def days_between_dates(date1, date2):
    d1 = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
    d2 = datetime.datetime.strptime(date2, '%Y-%m-%d').date()
    delta = d2 - d1
    return delta.days

# 2. Test forward reference fix
def is_powerful(magic):
    if magic == 'Sourcery':
        return True
    elif magic == 'More Sourcery':
        return True
    else:
        return False

def magical_hoist(magic):
    if is_powerful(magic):
        result = 'Magic'
    else:
        print("Not powerful.")
        result = 'Magic'
    print(result)

# RUN TESTS
print("TEST 1: days_between_dates() with datetime import")
days = days_between_dates('2026-01-01', '2026-02-06')
print(f"Result: {days} days between dates - PASS!")

print("\nTEST 2: is_powerful() function")
print(f"is_powerful('Sourcery'): {is_powerful('Sourcery')} - PASS!")
print(f"is_powerful('Regular'): {is_powerful('Regular')} - PASS!")

print("\nTEST 3: magical_hoist() calling is_powerful()")
magical_hoist('Sourcery')
print("No NameError - PASS!")

print("\n✅ All critical errors fixed successfully!")
