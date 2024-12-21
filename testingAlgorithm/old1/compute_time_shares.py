from sympy import symbols
import json

def calculate_time_share(params):
    numerator = symbols(params['numerator'])
    denominator = symbols(params['denominator'])
    delta_t = params['delta_t']

    symbolic_proportion = numerator / denominator
    numeric_proportion = float(symbolic_proportion.evalf())
    time_share = numeric_proportion * delta_t

    return {
        "symbolic_proportion": str(symbolic_proportion),
        "numeric_proportion": numeric_proportion,
        "time_share": time_share
    }

if __name__ == "__main__":
    params = json.loads(input())
    result = calculate_time_share(params)
    print(json.dumps(result))