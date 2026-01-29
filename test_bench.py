from python_scripts.get_symbol_list import my_n8n_logic
import json

test_input = 'HNX'

try:
    print(f"--- Testing with: {test_input} ---")
    results = my_n8n_logic(test_input)
    
    print(json.dumps(results[:5], indent=2))
    print(f"\nTotal: {len(results)} items")
    
except Exception as e:
    print(f"Error: {e}")