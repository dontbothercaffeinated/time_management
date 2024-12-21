from sympy import symbols, simplify
import json

def calculate_denominator(numerators):
    t = symbols('t')
    denominator = sum([symbols(expr) for expr in numerators.values()])
    return str(simplify(denominator))

if __name__ == "__main__":
    data = json.loads(input())
    numerators = data['numerators']
    denominator = calculate_denominator(numerators)
    print(json.dumps({"denominator": denominator}))