from sympy import symbols, exp, integrate, simplify

def calculate(params):
    # Convert Unix timestamps to time differences in hours
    t0 = params['t0']  # Unix timestamp for last run
    t1 = params['t1']  # Unix timestamp for current time
    due_date = params['D']  # Unix timestamp for due date

    delta_t = (t1 - t0) / 3600  # Time elapsed since last run, in hours
    D = (due_date - t1) / 3600  # Time remaining until due date, in hours

    # System variables
    Tmax = params['Tmax']  # Maximum task duration
    k = params['k']        # Exponential weighting factor

    # Other inputs
    mu_due_times = params['muDueTimes']
    sigma_due_times = params['sigmaDueTimes']
    mu_logged_times = params['muLoggedTimes']
    sigma_logged_times = params['sigmaLoggedTimes']
    logged_time = params['loggedTime']

    # Symbolic math with t_0 = 0, t_1 = delta_t
    t = symbols('t')

    # Formula components
    exp_term = (1 - exp(-k * (Tmax - (D - t)) / Tmax)) / (1 - exp(-k))
    first_bracket = 0.5 + 0.5 * exp_term
    second_bracket = 0.5 - 0.5 * exp_term

    due_times_component = first_bracket * ((D - t) - mu_due_times) / sigma_due_times
    logged_times_component = second_bracket * (logged_time - mu_logged_times) / sigma_logged_times

    numerator_integrand = due_times_component + logged_times_component

    # Integrate numerator and denominator
    numerator_integral = integrate(numerator_integrand, (t, t0, t1))
    denominator_integral = integrate(1, (t, t0, t1))  # Replace 1 with actual Pj(t) if known

    # Calculate symbolic proportion and numeric time share
    symbolic_proportion = numerator_integral / denominator_integral
    numeric_proportion = float(symbolic_proportion.evalf())
    time_share = numeric_proportion * delta_t

    return {
        "numerator": str(simplify(numerator_integral)),
        "denominator": str(simplify(denominator_integral)),
        "symbolic_proportion": str(simplify(symbolic_proportion)),
        "numeric_proportion": numeric_proportion,
        "time_share": time_share
    }

if __name__ == "__main__":
    import sys
    import json

    # Read input JSON from stdin
    input_data = json.loads(sys.stdin.read())
    try:
        result = calculate(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))